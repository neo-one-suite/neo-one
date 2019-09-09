/* @hash 4a41e22dcb7813bab493164a0214ae2d */
// tslint:disable
/* eslint-disable */
import { Injectable } from '@angular/core';
import { createClient, createDeveloperClients } from './client';
import { createEscrowSmartContract } from './Escrow/contract';
import { createTokenSmartContract } from './Token/contract';
import { createICOSmartContract } from './ICO/contract';

@Injectable({
  providedIn: 'root',
})
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
