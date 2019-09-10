/* @hash ae43031c4e6001d8705f07eea63c04b7 */
// tslint:disable
/* eslint-disable */
import { Client } from '@neo-one/client';
import { CoinICOSmartContract } from './types';
import { coinIcoABI } from './abi';
import { sourceMaps } from '../sourceMaps';

const definition = {
  networks: {
    local: {
      address: 'AUuCyg68Gvh3sY3ysPvsxWUHQ3oY7eeKSB',
    },
  },
  abi: coinIcoABI,
  sourceMaps,
};

export const createCoinICOSmartContract = <TClient extends Client>(client: TClient): CoinICOSmartContract<TClient> =>
  client.smartContract(definition);
