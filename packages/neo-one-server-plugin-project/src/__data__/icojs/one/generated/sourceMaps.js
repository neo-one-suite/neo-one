/* @hash 6e6420d58bfda29c46d8be62f51891e8 */
// tslint:disable
/* eslint-disable */
/* @source-map-hash c157903e3f7668726aad17f0d09d154c */
import { OneClient } from '@neo-one/client';
import { projectID } from './projectID';

let sourceMapsIn = Promise.resolve({});

if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
  sourceMapsIn = Promise.resolve().then(async () => {
    const client = new OneClient(43987);
    const result = await client.request({
      plugin: '@neo-one/server-plugin-project',
      options: { type: 'sourceMaps', projectID },
    });

    return result.response;
  });
}

export const sourceMaps = sourceMapsIn;
