/* @hash 52399dd31267d474e6d7ca032a8cf665 */
// tslint:disable
/* eslint-disable */
import { EscrowSmartContract, EscrowMigrationSmartContract } from './Escrow/types';
import { ICOSmartContract, ICOMigrationSmartContract } from './ICO/types';
import { TokenSmartContract, TokenMigrationSmartContract } from './Token/types';

export interface Contracts {
  readonly escrow: EscrowSmartContract;
  readonly ico: ICOSmartContract;
  readonly token: TokenSmartContract;
}

export interface MigrationContracts {
  readonly escrow: EscrowMigrationSmartContract;
  readonly ico: ICOMigrationSmartContract;
  readonly token: TokenMigrationSmartContract;
}
