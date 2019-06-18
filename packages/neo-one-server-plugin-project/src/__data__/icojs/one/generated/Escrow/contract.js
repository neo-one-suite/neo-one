/* @hash ee8345df6ece1f88093cf70bd6651415 */
// tslint:disable
/* eslint-disable */
import { escrowABI } from './abi';
import { sourceMaps } from '../sourceMaps';

const definition = {
  networks: {
    local: {
      address: 'ARqAzwfoNrZ2QNTaX5f5XqwhfFsRYioKNw',
    },
  },
  abi: escrowABI,
  sourceMaps,
};

export const createEscrowSmartContract = (client) => client.smartContract(definition);
