/* @hash 7cc432655a3143384fcda5ca93f35f51 */
// tslint:disable
/* eslint-disable */
import { Client, SmartContractDefinition } from '@neo-one/client';
import { escrowABI } from './abi';
import { EscrowSmartContract } from './types';
import { sourceMaps } from '../sourceMaps';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'ASVpdANwydQgsvMvptxzKcu5kPb8d27qor',
    },
  },
  abi: escrowABI,
  sourceMaps,
};

export const createEscrowSmartContract = <TClient extends Client>(client: TClient): EscrowSmartContract<TClient> =>
  client.smartContract<EscrowSmartContract<TClient>>(definition);
