/* @hash ba4c2d02de6f6fff287d33499e4c0951 */
// tslint:disable
/* eslint-disable */
import { createWithContracts, TestOptions, WithContractsOptions } from '@neo-one/smart-contract-test';
import { Contracts } from './contracts';
import * as path from 'path';

export const withContracts: (
  test: (contracts: Contracts & TestOptions) => Promise<void>,
  options?: WithContractsOptions,
) => Promise<void> = createWithContracts([
  { name: 'Escrow', filePath: path.resolve(__dirname, '../neo-one/contracts/Escrow.ts') },
  { name: 'Token', filePath: path.resolve(__dirname, '../neo-one/contracts/Token.ts') },
  { name: 'ICO', filePath: path.resolve(__dirname, '../neo-one/contracts/ICO.ts') },
]);
