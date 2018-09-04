/* @hash a3e8d471a6d91a8ef15104e1806d646d */
// tslint:disable
/* eslint-disable */
import { Client, ReadClient, SmartContractDefinition } from '@neo-one/client';
import { sourceMaps } from '../sourceMaps';
import { tokenABI } from './abi';
import { TokenReadSmartContract, TokenSmartContract } from './types';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'AKSLP1oNAfQtL9yfhPCgh2BDCLjPtSmDHu',
    },
  },
  abi: tokenABI,
  sourceMaps,
};

export const createTokenSmartContract = (client: Client): TokenSmartContract =>
  client.smartContract<TokenSmartContract>(definition);

export const createTokenReadSmartContract = (client: ReadClient): TokenReadSmartContract =>
  client.smartContract<TokenReadSmartContract>({
    address: definition.networks[client.dataProvider.network].address,
    abi: definition.abi,
    sourceMaps: definition.sourceMaps,
  });
