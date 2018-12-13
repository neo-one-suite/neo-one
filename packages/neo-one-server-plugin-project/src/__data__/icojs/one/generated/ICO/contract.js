/* @hash 13652a6ff77951118a9ece183c6abc1b */
// tslint:disable
/* eslint-disable */
import { icoABI } from './abi';
import { sourceMaps } from '../sourceMaps';
 const definition = {
  networks: {
    local: {
      address: 'AQUpTfMEdj2NzvDmXi73YEGCrdmQvmGfoF',
    },
  },
  abi: icoABI,
  sourceMaps,
};
 export const createICOSmartContract = (client) => client.smartContract(definition);
