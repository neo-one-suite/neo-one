/* @hash 1ebb0ecf7a3fe9239d39ba1113b48b2b */
// tslint:disable
/* eslint-disable */
import { Client, SmartContractDefinition } from '@neo-one/client';
import { sourceMaps } from '../sourceMaps';
import { tokenABI } from './abi';
import { TokenSmartContract } from './types';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'AGe7fjvh9WuxRL3E1AJtKhsVuasCcAGrXs',
    },
  },
  abi: tokenABI,
  sourceMaps,
};

export const createTokenSmartContract = <TClient extends Client>(client: TClient): TokenSmartContract<TClient> =>
  client.smartContract<TokenSmartContract<TClient>>(definition);
