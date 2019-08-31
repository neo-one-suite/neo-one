/* @hash dc315ea05d621ebfe01e55fb9e391fdc */
// tslint:disable
/* eslint-disable */
import { Client } from '@neo-one/client';
import { ICOSmartContract } from './types';
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

export const createICOSmartContract = <TClient extends Client>(client: TClient): ICOSmartContract<TClient> =>
  client.smartContract(definition);
