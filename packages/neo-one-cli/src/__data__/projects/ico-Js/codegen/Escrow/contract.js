/* @hash 768032287dcf0f7846afd18c79893a7b */
// tslint:disable
/* eslint-disable */
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

export const createEscrowSmartContract = (client) => client.smartContract(definition);
