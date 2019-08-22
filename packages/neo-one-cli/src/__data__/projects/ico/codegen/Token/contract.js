/* @hash a2ff95c3e55f78d6432209212d711a09 */
// tslint:disable
/* eslint-disable */
import { sourceMaps } from '../sourceMaps';
import { tokenABI } from './abi';

const definition = {
  networks: {
    local: {
      address: 'AaYf2HD7ruLa11ZwXjBvYSvkPAZGQRuySQ',
    },
  },
  abi: tokenABI,
  sourceMaps,
};

export const createTokenSmartContract = (client) => client.smartContract(definition);
