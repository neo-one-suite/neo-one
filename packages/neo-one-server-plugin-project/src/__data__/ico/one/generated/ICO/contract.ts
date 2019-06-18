/* @hash 89f96ab5ffc5809c1c00abe42c50c8be */
// tslint:disable
/* eslint-disable */
import { Client, SmartContractDefinition } from '@neo-one/client';
import { icoABI } from './abi';
import { ICOSmartContract } from './types';
import { sourceMaps } from '../sourceMaps';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'Adiq4sMWabmjD7S45BCvW2uVgFDofmTbyo',
    },
  },
  abi: icoABI,
  sourceMaps,
};

export const createICOSmartContract = <TClient extends Client>(client: TClient): ICOSmartContract<TClient> =>
  client.smartContract<ICOSmartContract<TClient>>(definition);
