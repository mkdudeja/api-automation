import { Component, ElementRef, OnInit, QueryList, TemplateRef, ViewChildren } from '@angular/core';
import { HARDataSource } from './HAR_Data';

interface IRequest extends chrome.devtools.network.Request {
  _resourceType: string;
  selected: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {

  title = 'APIAutomation';
  apiRequests: Array<IRequest> = [];
  // apiRequests: any[] = HARDataSource.filter(apiRequest => apiRequest._resourceType === 'xhr');
  isAnyRequestSelected = false;

  ngOnInit() {
    chrome.devtools.network.onRequestFinished.addListener(
      (request: IRequest) => {
        if (request._resourceType === 'xhr') {
          request.getContent((content: string, encoding: string) => {
            request.response.content.text = content;
            request.selected = false;
            this.apiRequests.push(request);
            console.log('this.apiRequests', this.apiRequests);
          });
        }
      }
    );
  }

  public selectRequest(request: IRequest) {
    request.selected = !request.selected;
    this.isAnyRequestSelected = this.apiRequests && this.apiRequests.filter(apiRequest => apiRequest.selected).length > 0 ? true : false;
  }

  public generateScript(
    request: IRequest,
    data: string = 'hello world...',
    filename: string = `${new Date().toDateString()}.txt`
  ) {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    chrome.downloads.download({ url: URL.createObjectURL(blob), filename });
  }

  public generateSelectedScript() {
    const selectedApis = this.apiRequests.filter(apiRequest => apiRequest.selected);
    console.log(selectedApis);
  }

  public generateAllScript() {
    console.log(this.apiRequests);
  }
}
