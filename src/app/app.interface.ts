export interface IRequest extends chrome.devtools.network.Request {
  _resourceType: string;
  selected: boolean;
}

export interface IDependencySource {
  api: string;
  path: string;
  name: string;
}

export interface IDependencyDestination {
  type: string;
  name: string;
  httpMethod: string;
}

export interface IDependency {
  source: IDependencySource;
  destination: IDependencyDestination;
}

export interface IDependencyDefinition {
  api: string;
  dependencies: Array<IDependency>;
}
