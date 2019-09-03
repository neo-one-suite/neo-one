/* @hash a9a75f814a32e2a8b1387c66830f5249 */
// tslint:disable
/* eslint-disable */
import { tokenABI } from './abi';
import { sourceMaps } from '../sourceMaps';

const definition = {
  networks: {
    local: {
      address: 'AaYf2HD7ruLa11ZwXjBvYSvkPAZGQRuySQ',
    },
    test: {
      address: 'AaYf2HD7ruLa11ZwXjBvYSvkPAZGQRuySQ',
    },
  },
  abi: tokenABI,
  sourceMaps,
};

export const createTokenSmartContract = (client) => client.smartContract(definition);
