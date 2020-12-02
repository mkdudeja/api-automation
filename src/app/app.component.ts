import { Component, OnInit } from '@angular/core';

declare var chrome: any;
const RECORDS_LIMIT = 400;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'APIAutomation';

  port = null;
  calls = [];
  callsData = {};
  tabs = {};

  ngOnInit() {
    this.port = chrome.runtime.connect({ name: 'start_listen' });
    this.port.onMessage.addListener(this._onMessage.bind(this));
  }

  private _onMessage(msg: any) {
    const callId = msg['req_details']['requestId'];
    const callUrl = msg['req_details']['url'];

    if (!this.callsData[callId]) {
      this.callsData[callId] = { url: callUrl };
      this.calls.push(callId);

      if (this.calls.length > RECORDS_LIMIT) {
        const lastCall = this.calls.shift();
        this.callsData[lastCall]['tr_obj'].remove();
        this.callsData[lastCall]['tr_details'].remove();
        delete this.callsData[lastCall];
      }
    }

    this.callsData[callId][msg['type']] = msg['req_details'];

    console.log(this.callsData);
  }
}
