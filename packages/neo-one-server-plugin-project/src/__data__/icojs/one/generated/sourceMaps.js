/* @hash ee8a3e22d6a55c43b3a74efd2f406866 */
// tslint:disable
/* eslint-disable */
/* @source-map-hash 58e693f79dbf19e60ce908e01e160838 */
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
