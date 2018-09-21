/* @hash 8c2017dad40ceeebf1c01d69f0f0cbca */
// tslint:disable
/* eslint-disable */
import { Client, ReadClient, SmartContractDefinition } from '@neo-one/client';
import { escrowABI } from './abi';
import { EscrowReadSmartContract, EscrowSmartContract } from './types';
import { sourceMaps } from '../sourceMaps';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'APoi7tZNhb2ZvCjrFZaGnVgowPQat1s9eY',
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
