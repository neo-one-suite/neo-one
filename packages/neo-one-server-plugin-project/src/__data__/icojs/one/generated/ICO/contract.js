/* @hash 7773852f14c6e9624ec4651b8e944dbf */
// tslint:disable
/* eslint-disable */
import { icoABI } from './abi';
import { sourceMaps } from '../sourceMaps';

const definition = {
  networks: {
    local: {
      address: 'Ae6so44HCmVWHfpFJhjg1zbHYYD2beR1pW',
    },
  },
  abi: icoABI,
  sourceMaps,
};

export const createICOSmartContract = (client) => client.smartContract(definition);
