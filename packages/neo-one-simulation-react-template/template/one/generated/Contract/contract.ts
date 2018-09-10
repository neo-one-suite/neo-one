/* @hash 2e3dfdb8417e6fe51601730dc01bafc9 */
// tslint:disable
/* eslint-disable */
import { Client, ReadClient, SmartContractDefinition } from '@neo-one/client';
import { contractABI } from './abi';
import { ContractReadSmartContract, ContractSmartContract } from './types';
import { sourceMaps } from '../sourceMaps';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'AMEaw3TMSx2cUynTy4RBgeJy9wxStDe3Mo',
    },
  },
  abi: contractABI,
  sourceMaps,
};

export const createContractSmartContract = (client: Client): ContractSmartContract =>
  client.smartContract<ContractSmartContract>(definition);

export const createContractReadSmartContract = (client: ReadClient): ContractReadSmartContract =>
  client.smartContract<ContractReadSmartContract>({
    address: definition.networks[client.dataProvider.network].address,
    abi: definition.abi,
    sourceMaps: definition.sourceMaps,
  });
