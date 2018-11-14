import { ABI } from '@neo-one/client-common';
import stringify from 'safe-stable-stringify';
import { getABIName } from './getABIName';

export const genABI = (name: string, abi: ABI) => ({
  js: `export const ${getABIName(name)} = ${stringify(abi, undefined, 2)};`,
  ts: `import { ABI } from '@neo-one/client';

export const ${getABIName(name)}: ABI = ${stringify(abi, undefined, 2)};
`,
});
