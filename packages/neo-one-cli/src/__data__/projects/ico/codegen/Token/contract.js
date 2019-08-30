/* @hash f1642cca275ce307d0ad13e2a79afbb5 */
// tslint:disable
/* eslint-disable */
import { sourceMaps } from '../sourceMaps';
import { tokenABI } from './abi';

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
