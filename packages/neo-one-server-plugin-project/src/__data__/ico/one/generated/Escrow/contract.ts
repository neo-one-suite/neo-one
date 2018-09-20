/* @hash 61925de7150e5e1f3c861d0979aa645b */
// tslint:disable
/* eslint-disable */
import { Client, ReadClient, SmartContractDefinition } from '@neo-one/client';
import { escrowABI } from './abi';
import { EscrowReadSmartContract, EscrowSmartContract } from './types';
import { sourceMaps } from '../sourceMaps';

const definition: SmartContractDefinition = {
  networks: {
    local: {
      address: 'AYHRS1GEuAqwf7yds4wU9tyquSJygcoLXT',
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
