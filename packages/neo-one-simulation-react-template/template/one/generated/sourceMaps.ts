/* @hash 3f01bb399b57d83e299dca7b1224c5d0 */
// tslint:disable
/* eslint-disable */
/* @source-map-hash b9a800d4258f962e9670ae3e66039f96 */
import { OneClient, SourceMaps } from '@neo-one/client';
import { projectID } from './projectID';

let sourceMapsIn: Promise<SourceMaps> = Promise.resolve({});
if (process.env.NODE_ENV !== 'production') {
  sourceMapsIn = Promise.resolve().then(async () => {
    const client = new OneClient(40101);
    const result = await client.request({
      plugin: '@neo-one/server-plugin-project',
      options: { type: 'sourceMaps', projectID },
    });

    return result.response;
  });
}

export const sourceMaps = sourceMapsIn;
