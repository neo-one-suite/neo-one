/* @hash 318d8dde636d3501fba475770694e147 */
// tslint:disable
/* eslint-disable */
import { sourceMaps } from '../sourceMaps';
import { tokenABI } from './abi';

const definition = {
  networks: {
    local: {
      address: 'AGe7fjvh9WuxRL3E1AJtKhsVuasCcAGrXs',
    },
  },
  abi: tokenABI,
  sourceMaps,
};

export const createTokenSmartContract = (client) => client.smartContract(definition);
