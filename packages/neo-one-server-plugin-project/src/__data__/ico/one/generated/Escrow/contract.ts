/* @hash c3a4b93d992713a30fb2493b2dfd7000 */
// tslint:disable
/* eslint-disable */
import { Client, ReadClient, SmartContractDefinition } from '@neo-one/client';
import { escrowABI } from './abi';
import { EscrowReadSmartContract, EscrowSmartContract } from './types';
import { sourceMaps } from '../sourceMaps';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'AHf8xFunkR4GBAHvPuo4xxDiHYwqP7xR4w',
    },
  },
  abi: escrowABI,
  sourceMaps,
};

export const createEscrowSmartContract = (client: Client): EscrowSmartContract =>
  client.smartContract<EscrowSmartContract>(definition);

export const createEscrowReadSmartContract = (client: ReadClient): EscrowReadSmartContract =>
  client.smartContract<EscrowReadSmartContract>({
    address: definition.networks[client.dataProvider.network].address,
    abi: definition.abi,
    sourceMaps: definition.sourceMaps,
  });
