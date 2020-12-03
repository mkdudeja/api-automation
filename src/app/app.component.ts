import { Component, OnInit } from '@angular/core';
import { HARDataSource } from './HAR_Data';

interface IRequest extends chrome.devtools.network.Request {
  _resourceType: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'APIAutomation';
  dataSource: Array<IRequest> = [];
  apiRequests = HARDataSource.filter(apiRequest => apiRequest._resourceType === 'xhr');

  ngOnInit() {
    // chrome.devtools.network.onRequestFinished.addListener(
    //   (request: IRequest) => {
    //     if (request._resourceType === 'xhr') {
    //       request.getContent((content: string, encoding: string) => {
    //         request.response.content.text = content;
    //         this.dataSource.push(request);
    //         console.log('this.dataSource', this.dataSource);
    //       });
    //     }
    //   }
    // );
    console.log(this.apiRequests);

  }

  public generateScript(request) {
    console.log(request);
  }
}
