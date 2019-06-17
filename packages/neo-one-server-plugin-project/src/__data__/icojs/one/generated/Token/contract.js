/* @hash 8572726a3f78b7018fc87e686561fc8f */
// tslint:disable
/* eslint-disable */
import { sourceMaps } from '../sourceMaps';
import { tokenABI } from './abi';

const definition = {
  networks: {
    local: {
      address: 'AKgzNjZy397DtvZMZRQQ2zH97sLS5BRUta',
    },
  },
  abi: tokenABI,
  sourceMaps,
};

export const createTokenSmartContract = (client) => client.smartContract(definition);
