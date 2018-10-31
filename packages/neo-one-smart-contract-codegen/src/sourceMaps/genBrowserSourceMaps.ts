import { SourceMaps } from '@neo-one/client-common';

export const genBrowserSourceMaps = ({ sourceMaps }: { readonly sourceMaps: SourceMaps }) => ({
  js: `
let sourceMapsIn = Promise.resolve({});

if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
  sourceMapsIn = Promise.resolve(${JSON.stringify(sourceMaps)});
}

export const sourceMaps = sourceMapsIn;
`,
  ts: `
import { SourceMaps } from '@neo-one/client';

let sourceMapsIn: Promise<SourceMaps> = Promise.resolve({});
if (process.env.NODE_ENV !== 'production' || process.env.NEO_ONE_DEV === 'true') {
  sourceMapsIn = Promise.resolve(${JSON.stringify(sourceMaps)} as any);
}

export const sourceMaps = sourceMapsIn;
`,
});
