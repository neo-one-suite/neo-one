/* @hash 5d151b02dae32d7c9977b12b02e782cc */
// tslint:disable
/* eslint-disable */
import { Client, DeveloperClients } from '@neo-one/client';
import { createClient, createDeveloperClients } from './client';
import { Contracts } from './contracts';
import { createEscrowSmartContract } from './Escrow/contract';
import { createTokenSmartContract } from './Token/contract';
import { createICOSmartContract } from './ICO/contract';

export class ContractsService {
  public client: Client;
  public developerClients: DeveloperClients;
  public escrow: Contracts['escrow'];
  public token: Contracts['token'];
  public ico: Contracts['ico'];

  constructor() {
    this.client = createClient();
    this.developerClients = createDeveloperClients();
    this.escrow = createEscrowSmartContract(this.client);
    this.token = createTokenSmartContract(this.client);
    this.ico = createICOSmartContract(this.client);
  }

  public setHost(host?: string) {
    this.client = createClient(host);
    this.developerClients = createDeveloperClients(host);
    this.escrow = createEscrowSmartContract(this.client);
    this.token = createTokenSmartContract(this.client);
    this.ico = createICOSmartContract(this.client);
  }
}

export const contractsService = new ContractsService();
