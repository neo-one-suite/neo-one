/* @hash c24e05f4aae8221d56ffb2ba8c53ec65 */
// tslint:disable
/* eslint-disable */
import { Client, SmartContractDefinition } from '@neo-one/client';
import { sourceMaps } from '../sourceMaps';
import { tokenABI } from './abi';
import { TokenSmartContract } from './types';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'AddK8EgYEULj3tDX9UykSjJwVcPzLvYQT6',
    },
  },
  abi: tokenABI,
  sourceMaps,
};

export const createTokenSmartContract = <TClient extends Client>(client: TClient): TokenSmartContract<TClient> =>
  client.smartContract<TokenSmartContract<TClient>>(definition);
