/* @hash ebea96a4c51d7c6fd5f2dc273bbd1db9 */
// tslint:disable
/* eslint-disable */
import { Client, SmartContractDefinition } from '@neo-one/client';
import { icoABI } from './abi';
import { ICOSmartContract } from './types';
import { sourceMaps } from '../sourceMaps';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'AHRtbAsKQn3AhMitSraByR8zDjTnD1kQb5',
    },
  },
  abi: icoABI,
  sourceMaps,
};

export const createICOSmartContract = <TClient extends Client>(client: TClient): ICOSmartContract<TClient> =>
  client.smartContract<ICOSmartContract<TClient>>(definition);
