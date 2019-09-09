/* @hash 2da8fff75ebc1a434854f8f7c41b803a */
// tslint:disable
/* eslint-disable */
import { tokenABI } from './abi';
import { sourceMaps } from '../sourceMaps';

const definition = {
  networks: {
    local: {
      address: 'AWFQ5usn6UPEQo85pNxLyNuuGnSvC9uckv',
    },
  },
  abi: tokenABI,
  sourceMaps,
};

export const createTokenSmartContract = (client) => client.smartContract(definition);
