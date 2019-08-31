/* @hash df67490897dca2a3c83d9970be9638f7 */
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
    test: {
      address: 'AXAZs3F9QHWZzpGV2GdWEkkopUWGSyDwAf',
    },
  },
  abi: escrowABI,
  sourceMaps,
};

export const createEscrowSmartContract = <TClient extends Client>(client: TClient): EscrowSmartContract<TClient> =>
  client.smartContract(definition);
