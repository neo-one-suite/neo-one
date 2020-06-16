/* @hash 793fa245837019b4c9e3a66341f16035 */
// tslint:disable
/* eslint-disable */
import { Client } from '@neo-one/client';

import { EscrowSmartContract, EscrowMigrationSmartContract } from './Escrow/types';
import { ICOSmartContract, ICOMigrationSmartContract } from './ICO/types';
import { TokenSmartContract, TokenMigrationSmartContract } from './Token/types';

import { createEscrowSmartContract } from './Escrow/contract';
import { createICOSmartContract } from './ICO/contract';
import { createTokenSmartContract } from './Token/contract';

export interface Contracts<TClient extends Client = Client> {
  readonly escrow: EscrowSmartContract<TClient>;
  readonly ico: ICOSmartContract<TClient>;
  readonly token: TokenSmartContract<TClient>;
}
// Refer to the MigrationSmartContract documentation at https://neo-one.io/docs/deployment for more information.
export interface MigrationContracts {
  readonly escrow: EscrowMigrationSmartContract;
  readonly ico: ICOMigrationSmartContract;
  readonly token: TokenMigrationSmartContract;
}

export const createContracts = <TClient extends Client>(client: TClient): Contracts<TClient> => ({
  escrow: createEscrowSmartContract(client),
  ico: createICOSmartContract(client),
  token: createTokenSmartContract(client),
});
