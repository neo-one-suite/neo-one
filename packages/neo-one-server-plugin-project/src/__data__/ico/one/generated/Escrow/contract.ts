/* @hash 513a7d599a52d52e92d8e404f3d0f83c */
// tslint:disable
/* eslint-disable */
import { Client, SmartContractDefinition } from '@neo-one/client';
import { escrowABI } from './abi';
import { EscrowSmartContract } from './types';
import { sourceMaps } from '../sourceMaps';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'Ab11QcupxzRCG8k74Y92nre5xqakZGro7M',
    },
  },
  abi: escrowABI,
  sourceMaps,
};

export const createEscrowSmartContract = <TClient extends Client>(client: TClient): EscrowSmartContract<TClient> =>
  client.smartContract<EscrowSmartContract<TClient>>(definition);
