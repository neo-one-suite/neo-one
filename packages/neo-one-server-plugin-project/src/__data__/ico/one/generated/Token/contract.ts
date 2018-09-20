/* @hash 5bbb240b2a20d7e643df5d9cf8df930b */
// tslint:disable
/* eslint-disable */
import { Client, ReadClient, SmartContractDefinition } from '@neo-one/client';
import { sourceMaps } from '../sourceMaps';
import { tokenABI } from './abi';
import { TokenReadSmartContract, TokenSmartContract } from './types';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'ALRRDs8zVm3tovjACnipDkTr9sFaRZAU7s',
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
