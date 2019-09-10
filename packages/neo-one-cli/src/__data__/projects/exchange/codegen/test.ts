/* @hash 7f4682a38c988dedec87b805dda91de0 */
// tslint:disable
/* eslint-disable */
import { createWithContracts, TestOptions, WithContractsOptions } from '@neo-one/smart-contract-test';
import { Contracts } from './contracts';
import * as path from 'path';

export const withContracts: (
  test: (contracts: Contracts & TestOptions) => Promise<void>,
  options?: WithContractsOptions,
) => Promise<void> = createWithContracts([
  { name: 'Coin', filePath: path.resolve(__dirname, '../neo-one/contracts/Coin.ts') },
  { name: 'Exchange', filePath: path.resolve(__dirname, '../neo-one/contracts/Exchange.ts') },
  { name: 'Token', filePath: path.resolve(__dirname, '../neo-one/contracts/Token.ts') },
  { name: 'CoinICO', filePath: path.resolve(__dirname, '../neo-one/contracts/CoinICO.ts') },
  { name: 'ICO', filePath: path.resolve(__dirname, '../neo-one/contracts/ICO.ts') },
]);
