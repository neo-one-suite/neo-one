/* @hash d0738eecb9ee0ca86f2c9341635c94a0 */
// tslint:disable
/* eslint-disable */
import { Client } from '@neo-one/client';

import { EscrowSmartContract, EscrowMigrationSmartContract } from './Escrow/types';
import { ICOSmartContract, ICOMigrationSmartContract } from './ICO/types';
import { TokenSmartContract, TokenMigrationSmartContract } from './Token/types';

export interface Contracts<TClient extends Client = Client> {
  readonly escrow: EscrowSmartContract<TClient>;
  readonly ico: ICOSmartContract<TClient>;
  readonly token: TokenSmartContract<TClient>;
}

export interface MigrationContracts {
  readonly escrow: EscrowMigrationSmartContract;
  readonly ico: ICOMigrationSmartContract;
  readonly token: TokenMigrationSmartContract;
}

export const createContracts: <TClient extends Client>(client: TClient) => Contracts<TClient>;
