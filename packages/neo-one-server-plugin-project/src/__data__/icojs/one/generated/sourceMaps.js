/* @hash de3c1d5897ec0df57f54f9ebe1874335 */
// tslint:disable
/* eslint-disable */
/* @source-map-hash 32e0931b0fbfae6bbcd23bc02c2be884 */
import { OneClient } from '@neo-one/client';
import { projectID } from './projectID';

let sourceMapsIn = Promise.resolve({});

if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
  sourceMapsIn = Promise.resolve().then(async () => {
    const client = new OneClient(31804);
    const result = await client.request({
      plugin: '@neo-one/server-plugin-project',
      options: { type: 'sourceMaps', projectID },
    });

    return result.response;
  });
}

export const sourceMaps = sourceMapsIn;
