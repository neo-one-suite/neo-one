/* @hash 9d7029f5ff407fa62af9bcb39a2894ff */
// tslint:disable
/* eslint-disable */
import { icoABI } from './abi';
import { sourceMaps } from '../sourceMaps';

const definition = {
  networks: {
    local: {
      address: 'Adiq4sMWabmjD7S45BCvW2uVgFDofmTbyo',
    },
  },
  abi: icoABI,
  sourceMaps,
};

export const createICOSmartContract = (client) => client.smartContract(definition);
