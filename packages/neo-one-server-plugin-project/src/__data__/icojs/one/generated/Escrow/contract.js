/* @hash 91276f4ff2e00a0ca53aeacf257770a0 */
// tslint:disable
/* eslint-disable */
import { escrowABI } from './abi';
import { sourceMaps } from '../sourceMaps';

const definition = {
  networks: {
    local: {
      address: 'AWu1S487KFtGHkx2gSe8BefCFdsZC8AVyt',
    },
  },
  abi: escrowABI,
  sourceMaps,
};

export const createEscrowSmartContract = (client) => client.smartContract(definition);
