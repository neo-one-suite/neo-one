/* @hash 51ae4a535182df2c299e2823350ba988 */
// tslint:disable
/* eslint-disable */
import { createEscrowSmartContract } from './Escrow/contract';
import { createICOSmartContract } from './ICO/contract';
import { createTokenSmartContract } from './Token/contract';

export const createContracts = (client) => ({
  escrow: createEscrowSmartContract(client),
  ico: createICOSmartContract(client),
  token: createTokenSmartContract(client),
});
