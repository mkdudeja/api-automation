export interface IRequest extends chrome.devtools.network.Request {
  _resourceType: string;
  selected: boolean;
}

export interface TabOptions {
  name: string;
  id: string;
}