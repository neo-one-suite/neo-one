/* @hash f8811c3c37072870b50329dad1b3afca */
// tslint:disable
/* eslint-disable */
import { Client } from '@neo-one/client';
import { TokenSmartContract } from './types';
import { tokenABI } from './abi';
import { sourceMaps } from '../sourceMaps';

const definition = {
  networks: {
    local: {
      address: 'AaYf2HD7ruLa11ZwXjBvYSvkPAZGQRuySQ',
    },
  },
  abi: tokenABI,
  sourceMaps,
};

export const createTokenSmartContract = <TClient extends Client>(client: TClient): TokenSmartContract<TClient> =>
  client.smartContract(definition);
