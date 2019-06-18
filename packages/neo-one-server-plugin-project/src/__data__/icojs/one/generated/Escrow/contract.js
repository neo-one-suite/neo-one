/* @hash 3544bbef7d820f32033f6a3d8421c1af */
// tslint:disable
/* eslint-disable */
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

export const createEscrowSmartContract = (client) => client.smartContract(definition);
