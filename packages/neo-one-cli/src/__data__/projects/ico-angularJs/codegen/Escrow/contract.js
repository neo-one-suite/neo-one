/* @hash a7424ef091bdbef89c5b71926f49d9ed */
// tslint:disable
/* eslint-disable */
import { escrowABI } from './abi';
import { sourceMaps } from '../sourceMaps';

const definition = {
  networks: {
    local: {
      address: 'AVtU2izPDU8HPiw4ZCuyqAsxg6WjUa7w29',
    },
  },
  abi: escrowABI,
  sourceMaps,
};

export const createEscrowSmartContract = (client) => client.smartContract(definition);
