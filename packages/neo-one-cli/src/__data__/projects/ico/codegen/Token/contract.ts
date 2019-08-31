/* @hash c065d3971c94cb5787604bb881209aed */
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
    test: {
      address: 'AaYf2HD7ruLa11ZwXjBvYSvkPAZGQRuySQ',
    },
  },
  abi: tokenABI,
  sourceMaps,
};

export const createTokenSmartContract = <TClient extends Client>(client: TClient): TokenSmartContract<TClient> =>
  client.smartContract(definition);
