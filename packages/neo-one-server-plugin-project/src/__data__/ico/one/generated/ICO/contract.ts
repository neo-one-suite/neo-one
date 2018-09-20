/* @hash ab50b338cc1201fb2cba8d8241c93837 */
// tslint:disable
/* eslint-disable */
import { Client, ReadClient, SmartContractDefinition } from '@neo-one/client';
import { icoABI } from './abi';
import { ICOReadSmartContract, ICOSmartContract } from './types';
import { sourceMaps } from '../sourceMaps';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'AckQDB49gSyrWJysBfRvEuP5KuhgteDpij',
    },
  },
  abi: icoABI,
  sourceMaps,
};

export const createICOSmartContract = (client: Client): ICOSmartContract =>
  client.smartContract<ICOSmartContract>(definition);

export const createICOReadSmartContract = (client: ReadClient): ICOReadSmartContract =>
  client.smartContract<ICOReadSmartContract>({
    address: definition.networks[client.dataProvider.network].address,
    abi: definition.abi,
    sourceMaps: definition.sourceMaps,
  });
