/* @hash b723bd931fe73ca53b24336890a29891 */
// tslint:disable
/* eslint-disable */
import { Client } from '@neo-one/client';
import { CoinSmartContract } from './types';
import { coinABI } from './abi';
import { sourceMaps } from '../sourceMaps';

const definition = {
  networks: {
    local: {
      address: 'AJJrj2p9Cj4xNtFH6Pv3JNmyVEAbm8YHPH',
    },
  },
  abi: coinABI,
  sourceMaps,
};

export const createCoinSmartContract = <TClient extends Client>(client: TClient): CoinSmartContract<TClient> =>
  client.smartContract(definition);
