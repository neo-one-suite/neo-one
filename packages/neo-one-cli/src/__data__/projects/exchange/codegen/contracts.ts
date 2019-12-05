/* @hash 16213223f8ade0fb4eb287fd54d1701a */
// tslint:disable
/* eslint-disable */
import { Client } from '@neo-one/client';

import { CoinSmartContract, CoinMigrationSmartContract } from './Coin/types';
import { CoinICOSmartContract, CoinICOMigrationSmartContract } from './CoinICO/types';
import { ExchangeSmartContract, ExchangeMigrationSmartContract } from './Exchange/types';
import { ICOSmartContract, ICOMigrationSmartContract } from './ICO/types';
import { TokenSmartContract, TokenMigrationSmartContract } from './Token/types';

import { createCoinSmartContract } from './Coin/contract';
import { createCoinICOSmartContract } from './CoinICO/contract';
import { createExchangeSmartContract } from './Exchange/contract';
import { createICOSmartContract } from './ICO/contract';
import { createTokenSmartContract } from './Token/contract';

export interface Contracts<TClient extends Client = Client> {
  readonly coin: CoinSmartContract<TClient>;
  readonly coinIco: CoinICOSmartContract<TClient>;
  readonly exchange: ExchangeSmartContract<TClient>;
  readonly ico: ICOSmartContract<TClient>;
  readonly token: TokenSmartContract<TClient>;
}

export interface MigrationContracts {
  readonly coin: CoinMigrationSmartContract;
  readonly coinIco: CoinICOMigrationSmartContract;
  readonly exchange: ExchangeMigrationSmartContract;
  readonly ico: ICOMigrationSmartContract;
  readonly token: TokenMigrationSmartContract;
}

export const createContracts = <TClient extends Client>(client: TClient): Contracts<TClient> => ({
  coin: createCoinSmartContract(client),
  coinIco: createCoinICOSmartContract(client),
  exchange: createExchangeSmartContract(client),
  ico: createICOSmartContract(client),
  token: createTokenSmartContract(client),
});
