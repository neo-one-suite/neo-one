/* @hash a6c11fb7302ee32fe517aae06bcedbe0 */
// tslint:disable
/* eslint-disable */
import { createWithContracts } from '@neo-one/smart-contract-test';
import * as path from 'path';

export const withContracts = createWithContracts([
  { name: 'Escrow', filePath: path.resolve(__dirname, '../contracts/Escrow.ts') },
  { name: 'Token', filePath: path.resolve(__dirname, '../contracts/Token.ts') },
  { name: 'ICO', filePath: path.resolve(__dirname, '../contracts/ICO.ts') },
]);
