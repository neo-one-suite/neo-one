/* @hash 2e3acfafdc43a4cdf560189bd85abe94 */
// tslint:disable
/* eslint-disable */
import { icoABI } from './abi';
import { sourceMaps } from '../sourceMaps';

const definition = {
  networks: {
    local: {
      address: 'ARW79N7gAWHytcWSkkXvwrJiR4FTyvf2f8',
    },
  },
  abi: icoABI,
  sourceMaps,
};

export const createICOSmartContract = (client) => client.smartContract(definition);
