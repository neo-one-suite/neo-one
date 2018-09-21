/* @hash 8a0e732eca2e3db44c8555ab42a98c67 */
// tslint:disable
/* eslint-disable */
/* @source-map-hash d5ed74ac9802fbf8b81fedd6c7bceb99 */
import { OneClient, SourceMaps } from '@neo-one/client';
import { projectID } from './projectID';

let sourceMapsIn: Promise<SourceMaps> = Promise.resolve({});
if (process.env.NODE_ENV !== 'production') {
  sourceMapsIn = Promise.resolve().then(async () => {
    const client = new OneClient(15624);
    const result = await client.request({
      plugin: '@neo-one/server-plugin-project',
      options: { type: 'sourceMaps', projectID },
    });

    return result.response;
  });
}

export const sourceMaps = sourceMapsIn;
