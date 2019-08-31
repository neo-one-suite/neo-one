import { SourceMaps } from '@neo-one/client-common';
import _ from 'lodash';
import * as nodePath from 'path';
import stringify from 'safe-stable-stringify';

const relativizeSources = (sourceMapsPath: string, sourceMaps: SourceMaps) =>
  _.fromPairs(
    Object.entries(sourceMaps).map(([key, sourceMap]) => [
      key,
      {
        ...sourceMap,
        sources: sourceMap.sources.map((source) => nodePath.relative(nodePath.dirname(sourceMapsPath), source)),
      },
    ]),
  );

export const genSourceMaps = ({
  sourceMapsPath,
  sourceMaps,
}: {
  readonly sourceMapsPath: string;
  readonly sourceMaps: SourceMaps;
}) => ({
  js: `
let sourceMapsIn = {};

if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
  sourceMapsIn = ${stringify(relativizeSources(sourceMapsPath, sourceMaps))};
}

export const sourceMaps = sourceMapsIn;
`,
  ts: `
import { SourceMaps } from '@neo-one/client';

let sourceMapsIn: SourceMaps = {};

if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
  sourceMapsIn = ${stringify(relativizeSources(sourceMapsPath, sourceMaps))} as any;
}

export const sourceMaps: SourceMaps = sourceMapsIn;
`,
});
