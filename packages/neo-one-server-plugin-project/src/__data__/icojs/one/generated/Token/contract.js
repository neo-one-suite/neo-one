/* @hash 855f67c88d4d8781e3c7ad94342a1161 */
// tslint:disable
/* eslint-disable */
import { sourceMaps } from '../sourceMaps';
import { tokenABI } from './abi';

const definition = {
  networks: {
    local: {
      address: 'ATdTfjgcYDUDiYdzfARiPyteN5UVmXby83',
    },
  },
  abi: tokenABI,
  sourceMaps,
};

export const createTokenSmartContract = (client) => client.smartContract(definition);
