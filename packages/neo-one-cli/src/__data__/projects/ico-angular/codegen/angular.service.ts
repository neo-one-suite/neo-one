/* @hash 6aa26755cf0b434e994d5d648d076c1f */
// tslint:disable
/* eslint-disable */
import { Injectable } from '@angular/core';
import { Client, DeveloperClients } from '@neo-one/client';
import { Contracts } from './contracts';
import { createClient, createDeveloperClients } from './client';
import { createEscrowSmartContract } from './Escrow/contract';
import { createTokenSmartContract } from './Token/contract';
import { createICOSmartContract } from './ICO/contract';

@Injectable({
  providedIn: 'root',
})
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
