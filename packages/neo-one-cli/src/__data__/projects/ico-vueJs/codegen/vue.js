/* @hash daaa2b8e939deeecae3def019c3deb69 */
// tslint:disable
/* eslint-disable */
import { createClient, createDeveloperClients } from './client';
import { createEscrowSmartContract } from './Escrow/contract';
import { createTokenSmartContract } from './Token/contract';
import { createICOSmartContract } from './ICO/contract';

export class ContractsService {
  constructor() {
    this.client = createClient();
    this.developerClients = createDeveloperClients();
    this.escrow = createEscrowSmartContract(this.client);
    this.token = createTokenSmartContract(this.client);
    this.ico = createICOSmartContract(this.client);
  }

  setHost(host) {
    this.client = createClient(host);
    this.developerClients = createDeveloperClients(host);
    this.escrow = createEscrowSmartContract(this.client);
    this.token = createTokenSmartContract(this.client);
    this.ico = createICOSmartContract(this.client);
  }
}

export const contractsService = new ContractsService();
