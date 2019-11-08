/* @hash cbf814aad92097e383f4f0db282ad064 */
// tslint:disable
/* eslint-disable */
import { createWithContracts } from '@neo-one/smart-contract-test';
import * as path from 'path';

export const withContracts = createWithContracts([
  {
    name: 'Escrow',
    filePath: path.resolve(__dirname, '../neo-one/contracts/Escrow.ts'),
  },
  {
    name: 'Token',
    filePath: path.resolve(__dirname, '../neo-one/contracts/Token.ts'),
  },
  {
    name: 'ICO',
    filePath: path.resolve(__dirname, '../neo-one/contracts/ICO.ts'),
  },
]);
