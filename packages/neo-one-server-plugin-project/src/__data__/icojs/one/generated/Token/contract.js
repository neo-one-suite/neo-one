/* @hash 9c782b25b737daba9d95dc10112ddca7 */
// tslint:disable
/* eslint-disable */
import { sourceMaps } from '../sourceMaps';
import { tokenABI } from './abi';

const definition = {
  networks: {
    local: {
      address: 'AddK8EgYEULj3tDX9UykSjJwVcPzLvYQT6',
    },
  },
  abi: tokenABI,
  sourceMaps,
};

export const createTokenSmartContract = (client) => client.smartContract(definition);
