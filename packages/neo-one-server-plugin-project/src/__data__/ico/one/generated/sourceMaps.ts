/* @hash 9d03cb7d59e7a5c8370f37a49a538f50 */
// tslint:disable
/* eslint-disable */
/* @source-map-hash 63818ba88cef8d5da3cf640a39f1489b */
import { OneClient, SourceMaps } from '@neo-one/client';
import { projectID } from './projectID';

let sourceMapsIn: Promise<SourceMaps> = Promise.resolve({});
if (process.env.NODE_ENV !== 'production') {
  sourceMapsIn = Promise.resolve().then(async () => {
    const client = new OneClient(46244);
    const result = await client.request({
      plugin: '@neo-one/server-plugin-project',
      options: { type: 'sourceMaps', projectID },
    });

    return result.response;
  });
}

export const sourceMaps = sourceMapsIn;
