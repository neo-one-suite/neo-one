/* @hash d2700e2f7211c82114c9b2cb473c0af9 */
// tslint:disable
/* eslint-disable */
import { icoABI } from './abi';
import { sourceMaps } from '../sourceMaps';

const definition = {
  networks: {
    local: {
      address: 'AHRtbAsKQn3AhMitSraByR8zDjTnD1kQb5',
    },
  },
  abi: icoABI,
  sourceMaps,
};

export const createICOSmartContract = (client) => client.smartContract(definition);
