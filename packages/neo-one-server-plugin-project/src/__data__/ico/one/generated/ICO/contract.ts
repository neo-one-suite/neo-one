/* @hash e062db212649a82e4b0458ed2ca46ea8 */
// tslint:disable
/* eslint-disable */
import { Client, SmartContractDefinition } from '@neo-one/client';
import { icoABI } from './abi';
import { ICOSmartContract } from './types';
import { sourceMaps } from '../sourceMaps';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'ATpaDcUGeeij5cxFnDnFRan9agCiWKuucV',
    },
  },
  abi: icoABI,
  sourceMaps,
};

export const createICOSmartContract = <TClient extends Client>(client: TClient): ICOSmartContract<TClient> =>
  client.smartContract<ICOSmartContract<TClient>>(definition);
