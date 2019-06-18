/* @hash a57bc9bd5886f51f28a138a0c18823fd */
// tslint:disable
/* eslint-disable */
/* @source-map-hash 67ff48db6a5549fa58aafef0baa18ff5 */
import { OneClient } from '@neo-one/client';
import { projectID } from './projectID';

let sourceMapsIn = Promise.resolve({});

if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
  sourceMapsIn = Promise.resolve().then(async () => {
    const client = new OneClient(10001);
    const result = await client.request({
      plugin: '@neo-one/server-plugin-project',
      options: { type: 'sourceMaps', projectID },
    });

    return result.response;
  });
}

export const sourceMaps = sourceMapsIn;
