/* @hash 56b6ffec10ac503f14d8718189c46698 */
// tslint:disable
/* eslint-disable */
import { icoABI } from './abi';
import { sourceMaps } from '../sourceMaps';

const definition = {
  networks: {
    local: {
      address: 'AV2JDACy2cRH1K7H1XYK7RA6WXMbQuCu7Y',
    },
  },
  abi: icoABI,
  sourceMaps,
};

export const createICOSmartContract = (client) => client.smartContract(definition);
