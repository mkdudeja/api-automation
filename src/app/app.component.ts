import { Component, NgZone, OnInit } from '@angular/core';
import { IDependencySourceFlat, IDependencyDestinationFlat, IRequest } from './app.interface';
import { dependencyMap } from './dependency.config';
import {
  getMethodTemplate,
  postMethodTemplate,
  sourceDependecyTemplate,
  destinationDependecyTemplate,
  testClassTemplate,
} from './test-template';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  constructor(private ngZone: NgZone) { }

  title = 'APIAutomation';
  apiRequests: Array<IRequest> = [];
  // apiRequests: any[] = HARDataSource.filter(apiRequest => apiRequest._resourceType === 'xhr');
  isAnyRequestSelected = false;

  sourceDependecies: IDependencySourceFlat[];
  destinationDependecies: IDependencyDestinationFlat[];

  ngOnInit() {
    chrome.devtools.network.onRequestFinished.addListener(
      (request: IRequest) => {
        if (request._resourceType === 'xhr') {
          request.getContent((content: string, encoding: string) => {
            request.response.content.text = content;
            request.selected = false;

            // processing the calls
            this.ngZone.run(() => {
              this.apiRequests.push(request);
              console.log('this.apiRequests', this.apiRequests);
            });
          });
        }
      }
    );
  }

  public selectRequest(request: IRequest) {
    request.selected = !request.selected;
    this.isAnyRequestSelected =
      this.apiRequests &&
        this.apiRequests.filter((apiRequest) => apiRequest.selected).length > 0
        ? true
        : false;
  }

  public generateScript(request: IRequest) {
    // const blob = new Blob([data], { type: 'application/octet-stream' });
    // chrome.downloads.download({ url: URL.createObjectURL(blob), filename });
    this._generateScripts([request]);
  }

  public generateSelectedScript() {
    const selectedApis = this.apiRequests.filter(
      (apiRequest) => apiRequest.selected
    );
    console.log(selectedApis);
    this._generateScripts(selectedApis);
  }

  public generateAllScript() {
    this._generateScripts(this.apiRequests);
    console.log(this.apiRequests);
  }

  private _generateScripts(requests: IRequest[]) {
    let generatedMethods = '';
    let baseUrl = '';
    this._flattenDependencies();
    for (let i = 0; i < requests.length; i++) {
      const apiRequest = requests[i];

      let method: string;
      if (apiRequest.request.method === 'GET') {
        method = getMethodTemplate;
      } else {
        method = postMethodTemplate;
      }

      if (!baseUrl && apiRequest.request.url.indexOf('/api') > 0) {
        baseUrl = apiRequest.request.url.split('/api')[0] + '/';
      }

      method = this._addDependecyLogic(apiRequest, method);

      method = method.replace('[[Order]]', (i + 1).toString());
      const urlParts = apiRequest.request.url.split('/');

      let testName = urlParts[urlParts.length - 1];
      if (apiRequest.request.url.indexOf('?') >= 0) {
        testName = testName.split('?')[0];
      }

      method = method.replace('[[TestName]]', testName);

      let content = apiRequest.request.postData
        ? apiRequest.request.postData.text
        : '';
      content = content.replace(/\"/g, '""');
      method = method.replace('[[JSONRequestContent]]', content);

      content = apiRequest.response.content
        ? apiRequest.response.content.text
        : '';
      content = content.replace(/\"/g, '""');
      method = method.replace('[[JSONResponseContent]]', content);

      method = method.replace(
        '[[ApiUrl]]',
        baseUrl
          ? apiRequest.request.url.replace(baseUrl, '')
          : apiRequest.request.url
      );

      generatedMethods += method;
    }

    let testClass = testClassTemplate.replace('[[HostUrl]]', baseUrl);

    testClass = testClass.replace('[[TEST_CASES]]', generatedMethods);

    const blob = new Blob([testClass], { type: 'application/octet-stream' });
    chrome.downloads.download({
      url: URL.createObjectURL(blob),
      filename: 'AutoApiTestClass.cs',
    });
  }

  private _addDependecyLogic(apiRequest: IRequest, method: string): string {
    let dependecyLogic: string = '';
    this.sourceDependecies.forEach(srcDep => {
      if (srcDep.api === '*' || apiRequest.request.url.toLowerCase().indexOf(srcDep.api.toLowerCase()) > 0) {
        let logic = sourceDependecyTemplate.replace("[[SOURCE_TYPE]]", srcDep.type);
        logic = logic.replace("[[SOURCE_PROP_NAME]]", srcDep.name);
        dependecyLogic += logic;
      }
    });

    method = method.replace("[[SourceDependencyLogic]]", dependecyLogic);

    dependecyLogic = '';
    this.destinationDependecies.forEach(desDep => {
      if ((desDep.api === '*' || apiRequest.request.url.toLowerCase().indexOf(desDep.api.toLowerCase()) > 0)
        && (!desDep.httpMethod || desDep.httpMethod.toUpperCase() === apiRequest.request.method.toUpperCase())) {
        let logic = destinationDependecyTemplate.replace("[[DESTINATION_TYPE]]", desDep.type);
        logic = logic.replace("[[DESTINATION_PROP_NAME]]", desDep.name);
        logic = logic.replace("[[SOURCE_PROP_NAME]]", desDep.sourceName);
        dependecyLogic += logic;
      }
    });

    method = method.replace("[[DestinationDependencyLogic]]", dependecyLogic);

    return method;
  }

  private _flattenDependencies() {
    this.sourceDependecies = [];
    this.destinationDependecies = [];
    dependencyMap.forEach(requestDependency => {

      requestDependency.dependencies.forEach(dependency => {
        const src: IDependencySourceFlat = {
          api: dependency.source.api
          , type: dependency.source.type
          , name: dependency.source.name
        };
        const des: IDependencyDestinationFlat = {
          api: requestDependency.api
          , type: dependency.destination.type
          , name: dependency.destination.name
          , httpMethod: dependency.destination.httpMethod
          , sourceName: dependency.source.name
        };
        this.sourceDependecies.push(src);
        this.destinationDependecies.push(des);
      });

    });
  }

}


