/* @hash 8b54820e64a7ce70e65a1a385c996efd */
// tslint:disable
/* eslint-disable */
import { Client } from '@neo-one/client';
import { ICOSmartContract } from './types';
import { icoABI } from './abi';
import { sourceMaps } from '../sourceMaps';

const definition = {
  networks: {
    local: {
      address: 'ARW79N7gAWHytcWSkkXvwrJiR4FTyvf2f8',
    },
  },
  abi: icoABI,
  sourceMaps,
};

export const createICOSmartContract = <TClient extends Client>(client: TClient): ICOSmartContract<TClient> =>
  client.smartContract(definition);
