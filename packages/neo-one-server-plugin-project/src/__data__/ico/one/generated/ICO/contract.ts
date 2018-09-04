/* @hash ac133d4b76beb11f2410e25a8e48143f */
// tslint:disable
/* eslint-disable */
import { Client, ReadClient, SmartContractDefinition } from '@neo-one/client';
import { icoABI } from './abi';
import { ICOReadSmartContract, ICOSmartContract } from './types';
import { sourceMaps } from '../sourceMaps';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'AafngKDBWEtbx8ZLg1jotEJNVjxt4DdrsT',
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
