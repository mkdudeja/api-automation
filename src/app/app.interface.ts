export interface IRequest extends chrome.devtools.network.Request {
  _resourceType: string;
  selected: boolean;
}

export interface IDependencySource {
  api: string;
  type: string;
  name: string;
}

export interface IDependencyDestination {
  type: string;
  name: string;
  httpMethod: string;
}

export interface IDependencySourceFlat {
  api: string;
  type: string;
  name: string;
  httpMethod?: string;
}

export interface IDependencyDestinationFlat {
  api: string;
  type: string;
  name: string;
  httpMethod?: string;
  sourceName: string;
}

export interface IDependency {
  source: IDependencySource;
  destination: IDependencyDestination;
}

export interface IDependencyDefinition {
  api: string;
  dependencies: Array<IDependency>;
}
