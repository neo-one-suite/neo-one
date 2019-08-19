import { SourceMaps } from '@neo-one/client-common';

export const genSourceMaps = ({ sourceMaps }: { readonly sourceMaps: SourceMaps }) => ({
  js: `
let sourceMapsIn = {};

if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
  sourceMapsIn = ${JSON.stringify(sourceMaps)};
}

export const sourceMaps = sourceMapsIn;
`,
  ts: `
import { SourceMaps } from '@neo-one/client';

export const sourceMaps: SourceMaps;
`,
});
