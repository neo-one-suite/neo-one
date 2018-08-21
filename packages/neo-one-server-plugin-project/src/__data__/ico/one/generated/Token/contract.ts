// tslint:disable
/* eslint-disable */
import { Client, ReadClient, SmartContractDefinition } from '@neo-one/client';
import { sourceMaps } from '../sourceMaps';
import { tokenABI } from './abi';
import { TokenReadSmartContract, TokenSmartContract } from './types';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'AeWd2717kC8QtwfoWZSbGwMFBCT6EsQw1V',
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
