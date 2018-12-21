/* @hash b37b52d50eaa5d8c367ee695ff2a5372 */
// tslint:disable
/* eslint-disable */
import { withContracts as withContractsBase } from '@neo-one/smart-contract-test';
import * as path from 'path';
 export const withContracts = async (test, options) =>
  withContractsBase(
    [
      { name: 'Escrow', filePath: path.resolve(__dirname, '../contracts/Escrow.ts') },
      { name: 'Token', filePath: path.resolve(__dirname, '../contracts/Token.ts') },
      { name: 'ICO', filePath: path.resolve(__dirname, '../contracts/ICO.ts') },
    ],
    test,
    options,
  );
