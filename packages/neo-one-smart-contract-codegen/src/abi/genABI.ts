import { ABI } from '@neo-one/client-core';
import stringify from 'safe-stable-stringify';
import { getABIName } from './getABIName';

export const genABI = (name: string, abi: ABI) => `import { ABI } from '@neo-one/client';

export const ${getABIName(name)}: ABI = ${stringify(abi, undefined, 2)};
`;
