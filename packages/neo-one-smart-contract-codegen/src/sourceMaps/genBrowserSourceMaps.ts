import { SourceMaps } from '@neo-one/client';

export const genBrowserSourceMaps = ({ sourceMaps }: { readonly sourceMaps: SourceMaps }) => ({
  js: `
let sourceMapsIn = Promise.resolve({});

if (process.env.NODE_ENV !== 'production') {
  sourceMapsIn = Promise.resolve(${JSON.stringify(sourceMaps)});
}

export const sourceMaps = sourceMapsIn;
`,
  ts: `
import { SourceMaps } from '@neo-one/client';

let sourceMapsIn: Promise<SourceMaps> = Promise.resolve({});
if (process.env.NODE_ENV !== 'production') {
  sourceMapsIn = Promise.resolve(${JSON.stringify(sourceMaps)});
}

export const sourceMaps = sourceMapsIn;
`,
});
