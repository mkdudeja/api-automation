import { Component, NgZone, OnInit } from '@angular/core';
import {
  IDependencySourceFlat,
  IDependencyDestinationFlat,
  IRequest,
  TabOptions,
  IDependencyDefinition,
} from './app.interface';
import { dependencyMap } from './dependency.config';
import {
  GETMETHODTEMPLATE,
  POSTMETHODTEMPLATE,
  SOURCEDEPENDECYTEMPLATE,
  DESTINATIONDEPENDECYTEMPLATE,
  TESTCLASSTEMPLATE,
} from './test-template';
import * as helper from './helper-extensions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  constructor(private ngZone: NgZone) {}

  title = 'APIAutomation';
  getMethodTemplate: string = null;
  postMethodTemplate: string = null;
  testClassTemplate: string = null;
  apiRequests: Array<IRequest> = [];
  // apiRequests: any[] = HARDataSource.filter(apiRequest => apiRequest._resourceType === 'xhr');
  isAnyRequestSelected = false;
  leftPanelCollapsed = true;
  selectedTab = 'templates';

  configValue: string = null;
  templateValue: string = null;
  dependencyDefs: Array<IDependencyDefinition> = dependencyMap;

  tabOptions: TabOptions[] = [
    { name: 'Templates', id: 'templates' },
    { name: 'Config', id: 'config' },
  ];

  hostname = null;
  sourceDependecies: IDependencySourceFlat[];
  destinationDependecies: IDependencyDestinationFlat[];

  ngOnInit() {
    // initialize hostname
    chrome.tabs.get(
      chrome.devtools.inspectedWindow.tabId,
      (tab: chrome.tabs.Tab) => {
        const location = new URL(tab.url);
        this.hostname = location.hostname;
        // this._initFromStorage();
      }
    );

    this.checkForTemplates();
    this.templateValue = GETMETHODTEMPLATE;

    // subscribe to network request
    chrome.devtools.network.onRequestFinished.addListener(
      (request: IRequest) => {
        if (
          request._resourceType === 'xhr' &&
          request.request.url.indexOf('/api') > -1 &&
          !request.request.url.includes('sockjs-node')
        ) {
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

  private checkForTemplates() {
    chrome.storage.local.get(['getMethodTemplate'], (result) => {
      this.getMethodTemplate = result.key || GETMETHODTEMPLATE;
    });

    chrome.storage.local.get(['postMethodTemplate'], (result) => {
      this.postMethodTemplate = result.key || POSTMETHODTEMPLATE;
    });

    chrome.storage.local.get(['testClassTemplate'], (result) => {
      this.testClassTemplate = result.key || TESTCLASSTEMPLATE;
    });
  }

  public clearAllRequests() {
    this.apiRequests = [];
  }

  public saveConfig(configValue: string) {
    this._setStorage('config', configValue);
  }

  public templateTypeChange(templateType: string) {
    if (!templateType) {
      return;
    }
    this.templateValue = this[templateType];
  }

  public saveTemplate(templateValue: string, templateType: string) {
    if (templateValue) {
      chrome.storage.local.set({ templateType: templateValue }, function () {
        console.log(
          'Value is set to ' + templateValue + ' for ' + templateValue
        );
        this[templateType] = templateValue;
      });
    }
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
    this._generateScripts([request]);
  }

  public generateSelectedScript() {
    const selectedApis = this.apiRequests.filter(
      (apiRequest) => apiRequest.selected
    );
    this._generateScripts(selectedApis);
  }

  public generateAllScript() {
    this._generateScripts(this.apiRequests);
  }

  private _generateScripts(requests: IRequest[]) {
    let generatedMethods = '';
    let baseUrl = '';

    this._flattenDependencies();
    for (let i = 0; i < requests.length; i++) {
      const apiRequest = requests[i];

      let method: string;
      if (apiRequest.request.method === 'GET') {
        method = this.getMethodTemplate;
      } else {
        method = this.postMethodTemplate;
      }

      if (!baseUrl && apiRequest.request.url.indexOf('/api') > 0) {
        baseUrl = apiRequest.request.url.split('/api')[0] + '/';
      }

      method = this._addDependecyLogic(apiRequest, method);
      method = this._setReponseAssertion(apiRequest, method);

      method = method.replace('[[Order]]', (i + 1).toString());
      const urlParts = apiRequest.request.url.split('/');

      let testName = '';
      for (let i = urlParts.length - 1; i >= 0; i--) {
        if (urlParts[i] !== '') {
          testName = urlParts[i];
          break;
        }
      }

      if (apiRequest.request.url.indexOf('?') >= 0) {
        testName = testName.split('?')[0];
      }
      testName =
        testName[0].toUpperCase() +
        testName.substring(1) +
        '_' +
        (i + 1).toString();
      method = method.replace('[[TestName]]', testName);

      let content = apiRequest.request.postData
        ? apiRequest.request.postData.text
        : '';
      if (!content) {
        content = '';
      }
      content = content.replace(/\"/g, '""');
      method = method.replace('[[JSONRequestContent]]', content);

      content = apiRequest.response.content
        ? apiRequest.response.content.text
        : '';
      if (!content) {
        content = '';
      }
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

    let testClass = this.testClassTemplate.replace('[[HostUrl]]', baseUrl);

    testClass = testClass.replace('[[TEST_CASES]]', generatedMethods);

    const blob = new Blob([testClass], { type: 'application/octet-stream' });
    chrome.downloads.download({
      url: URL.createObjectURL(blob),
      filename: 'AutoApiTestClass.cs',
    });
  }

  private _setReponseAssertion(apiRequest: IRequest, method: string): string {
    for (let i = 0; i < dependencyMap.length; i++) {
      if (
        (dependencyMap[i].api === '*' ||
          apiRequest.request.url
            .toLowerCase()
            .indexOf(dependencyMap[i].api.toLowerCase()) > 0) &&
        dependencyMap[i].skipResponseAssert
      ) {
        return method.replace('[[AssertReponse]]', 'false');
      }
    }

    return method.replace('[[AssertReponse]]', 'true');
  }

  private _addDependecyLogic(apiRequest: IRequest, method: string): string {
    let dependecyLogic: string = '';
    this.sourceDependecies.forEach((srcDep) => {
      if (
        srcDep.api === '*' ||
        apiRequest.request.url.toLowerCase().indexOf(srcDep.api.toLowerCase()) >
          0
      ) {
        let logic = SOURCEDEPENDECYTEMPLATE.replace(
          '[[SOURCE_TYPE]]',
          srcDep.type
        );
        logic = logic.replace('[[SOURCE_PROP_NAME]]', srcDep.name);
        dependecyLogic += logic;
      }
    });

    method = method.replace('[[SourceDependencyLogic]]', dependecyLogic);

    dependecyLogic = '';
    this.destinationDependecies.forEach((desDep) => {
      if (
        (desDep.api === '*' ||
          apiRequest.request.url
            .toLowerCase()
            .indexOf(desDep.api.toLowerCase()) > 0) &&
        (!desDep.httpMethod ||
          desDep.httpMethod.toUpperCase() ===
            apiRequest.request.method.toUpperCase())
      ) {
        let logic = DESTINATIONDEPENDECYTEMPLATE.replace(
          '[[DESTINATION_TYPE]]',
          desDep.type
        );
        logic = logic.replace('[[DESTINATION_PROP_NAME]]', desDep.name);
        logic = logic.replace('[[SOURCE_PROP_NAME]]', desDep.sourceName);
        dependecyLogic += logic;
      }
    });

    method = method.replace('[[DestinationDependencyLogic]]', dependecyLogic);

    return method;
  }

  private _flattenDependencies() {
    this.sourceDependecies = [];
    this.destinationDependecies = [];
    dependencyMap.forEach((requestDependency) => {
      if (requestDependency.dependencies) {
        requestDependency.dependencies.forEach((dependency) => {
          const src: IDependencySourceFlat = {
            api: dependency.source.api,
            type: dependency.source.type,
            name: dependency.source.name,
          };
          const des: IDependencyDestinationFlat = {
            api: requestDependency.api,
            type: dependency.destination.type,
            name: dependency.destination.name,
            httpMethod: dependency.destination.httpMethod,
            sourceName: dependency.source.name,
          };
          this.sourceDependecies.push(src);
          this.destinationDependecies.push(des);
        });
      }
    });
  }

  private _setStorage(key: string, value: string) {
    const keyName = this.hostname;
    chrome.storage.local.get([keyName], (data: { [k: string]: string }) => {
      const storageData = data.hasOwnProperty(keyName) ? data[keyName] : {};
      value = value.trim();
      if (value) {
        storageData[key] = JSON.stringify(value);
      } else {
        delete storageData[key];
      }
      chrome.storage.local.set({ [keyName]: storageData });
    });
  }

  private _initFromStorage() {
    const keyName = this.hostname;
    chrome.storage.local.get([keyName], (data: { [k: string]: string }) => {
      const storageData = data.hasOwnProperty(keyName) ? data[keyName] : {},
        configValue = helper.getPropertyValue(storageData, 'config', null);
      console.log('storageData', storageData);
      // init class members - dependencyDefs
      try {
        this.dependencyDefs = configValue
          ? JSON.parse(configValue)
          : dependencyMap;
      } catch (e) {
        this.dependencyDefs = dependencyMap;
        console.log('[Error] dependencyDefs', e);
      }
    });
  }
}
