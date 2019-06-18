/* @hash ed1f90f59dcdfd4abca05a816b0e4fd3 */
// tslint:disable
/* eslint-disable */
import { Client, SmartContractDefinition } from '@neo-one/client';
import { escrowABI } from './abi';
import { EscrowSmartContract } from './types';
import { sourceMaps } from '../sourceMaps';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'ARqAzwfoNrZ2QNTaX5f5XqwhfFsRYioKNw',
    },
  },
  abi: escrowABI,
  sourceMaps,
};

export const createEscrowSmartContract = <TClient extends Client>(client: TClient): EscrowSmartContract<TClient> =>
  client.smartContract<EscrowSmartContract<TClient>>(definition);
