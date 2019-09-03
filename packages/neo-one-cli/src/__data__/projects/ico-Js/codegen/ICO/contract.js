/* @hash 8f01b3934a7ad72cc29b8d8c964e7877 */
// tslint:disable
/* eslint-disable */
import { icoABI } from './abi';
import { sourceMaps } from '../sourceMaps';

const definition = {
  networks: {
    local: {
      address: 'Adiq4sMWabmjD7S45BCvW2uVgFDofmTbyo',
    },
    test: {
      address: 'Adiq4sMWabmjD7S45BCvW2uVgFDofmTbyo',
    },
  },
  abi: icoABI,
  sourceMaps,
};

export const createICOSmartContract = (client) => client.smartContract(definition);
