/* @hash 1fed6cde1eaf23563a0247f4def3fb16 */
// tslint:disable
/* eslint-disable */
/* @source-map-hash 10123d91f1124a2756cd13efc0357687 */
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
