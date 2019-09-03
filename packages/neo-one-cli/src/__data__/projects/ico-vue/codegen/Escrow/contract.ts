/* @hash 491e554f0f4efbca67639013d76f2a8e */
// tslint:disable
/* eslint-disable */
import { Client } from '@neo-one/client';
import { EscrowSmartContract } from './types';
import { escrowABI } from './abi';
import { sourceMaps } from '../sourceMaps';

const definition = {
  networks: {
    local: {
      address: 'AXAZs3F9QHWZzpGV2GdWEkkopUWGSyDwAf',
    },
  },
  abi: escrowABI,
  sourceMaps,
};

export const createEscrowSmartContract = <TClient extends Client>(client: TClient): EscrowSmartContract<TClient> =>
  client.smartContract(definition);
