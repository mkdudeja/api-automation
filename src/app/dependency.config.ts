import { IDependencyDefinition } from './app.interface';

export const dependencyMap: Array<IDependencyDefinition> = [
  {
    api: '*',
    dependencies: [
      {
        source: {
          api: 'account/GetAntiForgeryTokens',
          type: 'response.cookies',
          name: 'XSRF-TOKEN',
        },
        destination: {
          type: 'header',
          name: 'X-XSRF-TOKEN',
          httpMethod: 'POST',
        },
      },
    ],
  },
  {
    api: 'account/GetAntiForgeryTokens',
    dependencies: [
      {
        source: {
          api: 'account/login',
          type: 'response.content',
          name: 'SessionId',
        },
        destination: {
          type: 'QueryParams',
          name: 'sessionId',
          httpMethod: 'GET',
        },
      },
    ],
  },
];
