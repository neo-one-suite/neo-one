/* @hash 6124048907adbe6f6f5eee9d764fb90f */
// tslint:disable
/* eslint-disable */
import { Client, SmartContractDefinition } from '@neo-one/client';
import { icoABI } from './abi';
import { ICOSmartContract } from './types';
import { sourceMaps } from '../sourceMaps';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'AV2JDACy2cRH1K7H1XYK7RA6WXMbQuCu7Y',
    },
  },
  abi: icoABI,
  sourceMaps,
};

export const createICOSmartContract = <TClient extends Client>(client: TClient): ICOSmartContract<TClient> =>
  client.smartContract<ICOSmartContract<TClient>>(definition);
