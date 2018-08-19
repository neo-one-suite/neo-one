import _ from 'lodash';
import stringify from 'safe-stable-stringify';
import { ContractPaths } from '../type';
import { lowerCaseFirst } from '../utils';

export const genSourceMaps = ({ contractsPaths }: { readonly contractsPaths: ReadonlyArray<ContractPaths> }) => ({
  js: `
let sourceMapsIn = {};

if (process.env.NODE_ENV !== 'production') {
  ${contractsPaths
    .map(({ name, sourceMap }) => `const ${lowerCaseFirst(name)} = ${stringify(sourceMap, undefined, 2)};`)
    .join('\n  ')}
  sourceMapsIn = {
    ${_.flatMap(contractsPaths, ({ name, addresses }) =>
      addresses.map((address) => `'${address}': ${lowerCaseFirst(name)},`),
    ).join('\n    ')}
  };
}

export const sourceMaps = sourceMapsIn;
`,
  ts: `import { SourceMaps } from '@neo-one/client';

let sourceMapsIn: SourceMaps = {};
if (process.env.NODE_ENV !== 'production') {
  ${contractsPaths
    .map(({ name, sourceMap }) => `const ${lowerCaseFirst(name)}: any = ${stringify(sourceMap, undefined, 2)};`)
    .join('\n  ')}
  sourceMapsIn = {
    ${_.flatMap(contractsPaths, ({ name, addresses }) =>
      addresses.map((address) => `'${address}': ${lowerCaseFirst(name)},`),
    ).join('\n    ')}
  };
}

export const sourceMaps = sourceMapsIn;
`,
});
