/* @hash 3b6e0ca68d4f7a3ba772fde332850e00 */
// tslint:disable
/* eslint-disable */
import { Client, SmartContractDefinition } from '@neo-one/client';
import { escrowABI } from './abi';
import { EscrowSmartContract } from './types';
import { sourceMaps } from '../sourceMaps';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'APoi7tZNhb2ZvCjrFZaGnVgowPQat1s9eY',
    },
  },
  abi: escrowABI,
  sourceMaps,
};

export const createEscrowSmartContract = <TClient extends Client>(client: TClient): EscrowSmartContract<TClient> =>
  client.smartContract<EscrowSmartContract<TClient>>(definition);
