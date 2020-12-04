import { IDependencyDefinition } from './app.interface';

export const dependencyMap: Array<IDependencyDefinition> = JSON.parse(
  JSON.stringify([
    {
      api: '*',
      dependencies: [
        {
          source: {
            api: 'account/GetAntiForgeryTokens',
            type: 'COOKIE',
            name: 'XSRF-TOKEN',
          },
          destination: {
            type: 'HEADER',
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
            type: 'CONTENT',
            name: 'SessionId',
          },
          destination: {
            type: 'QUERY_PARAMS',
            name: 'sessionId',
            httpMethod: 'GET',
          },
        },
      ],
    },
    {
      api: 'account/login',
      skipResponseAssert: true,
    },
    {
      api: 'api/Program/GetPrograms',
      skipResponseAssert: true,
    },
  ])
);
