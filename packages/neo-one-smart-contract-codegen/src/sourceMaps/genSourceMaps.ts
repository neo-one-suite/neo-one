import { SourceMaps } from '@neo-one/client-common';
import { createHash, Hash } from 'crypto';
import _ from 'lodash';
import { RawSourceMap } from 'source-map';
import { getRelativeImport } from '../utils';

const hashSourceMap = (hash: Hash, sourceMap: RawSourceMap) =>
  hash
    .update((sourceMap.file as string | undefined) === undefined ? '' : sourceMap.file)
    .update(sourceMap.mappings)
    .update(sourceMap.names.join(':'))
    .update((sourceMap.sourcesContent === undefined ? [] : sourceMap.sourcesContent).join(':'))
    .update(`${sourceMap.version}`);

const hashSourceMaps = (sourceMaps: SourceMaps) =>
  _.sortBy(Object.entries(sourceMaps), [([key]: [string, RawSourceMap]) => key])
    .reduce((hash, value) => hashSourceMap(hash, value[1]), createHash('md5').update('v1'))
    .digest('hex');

export const genSourceMaps = ({
  httpServerPort,
  sourceMapsPath,
  projectIDPath,
  sourceMaps,
}: {
  readonly httpServerPort: number;
  readonly sourceMapsPath: string;
  readonly projectIDPath: string;
  readonly sourceMaps: SourceMaps;
}) => {
  const hash = hashSourceMaps(sourceMaps);

  return {
    js: `/* @source-map-hash ${hash} */
import { OneClient } from '@neo-one/client';
import { projectID } from '${getRelativeImport(sourceMapsPath, projectIDPath)}';

let sourceMapsIn = Promise.resolve({});

if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
  sourceMapsIn = Promise.resolve().then(async () => {
    const client = new OneClient(${httpServerPort});
    const result = await client.request({
      plugin: '@neo-one/server-plugin-project',
      options: { type: 'sourceMaps', projectID },
    });

    return result.response;
  });
}

export const sourceMaps = sourceMapsIn;
`,
    ts: `/* @source-map-hash ${hash} */
import { OneClient, SourceMaps } from '@neo-one/client';
import { projectID } from '${getRelativeImport(sourceMapsPath, projectIDPath)}';

let sourceMapsIn: Promise<SourceMaps> = Promise.resolve({});
if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
  sourceMapsIn = Promise.resolve().then(async () => {
    const client = new OneClient(${httpServerPort});
    const result = await client.request({
      plugin: '@neo-one/server-plugin-project',
      options: { type: 'sourceMaps', projectID },
    });

    return result.response;
  });
}

export const sourceMaps = sourceMapsIn;
`,
  };
};
