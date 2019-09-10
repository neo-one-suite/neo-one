/* @hash 5b872188871a9c4e807737501775f4f4 */
// tslint:disable
/* eslint-disable */
import { Client } from '@neo-one/client';
import { ExchangeSmartContract } from './types';
import { exchangeABI } from './abi';
import { sourceMaps } from '../sourceMaps';

const definition = {
  networks: {
    local: {
      address: 'AUbnSw4LtdnNg5HyobXKvrz8nwSPDnzp5n',
    },
  },
  abi: exchangeABI,
  sourceMaps,
};

export const createExchangeSmartContract = <TClient extends Client>(client: TClient): ExchangeSmartContract<TClient> =>
  client.smartContract(definition);
