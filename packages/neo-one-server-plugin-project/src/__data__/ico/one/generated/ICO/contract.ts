/* @hash 7db58eaacba5df52738ced8f3aee2b7d */
// tslint:disable
/* eslint-disable */
import { Client, SmartContractDefinition } from '@neo-one/client';
import { icoABI } from './abi';
import { ICOSmartContract } from './types';
import { sourceMaps } from '../sourceMaps';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'Ae6so44HCmVWHfpFJhjg1zbHYYD2beR1pW',
    },
  },
  abi: icoABI,
  sourceMaps,
};

export const createICOSmartContract = <TClient extends Client>(client: TClient): ICOSmartContract<TClient> =>
  client.smartContract<ICOSmartContract<TClient>>(definition);
