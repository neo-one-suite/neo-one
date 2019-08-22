/* @hash 4077ff287a22dfabc0ea949c05c0a553 */
// tslint:disable
/* eslint-disable */
import { Client } from '@neo-one/client';
import { EscrowSmartContract } from './types';

export const createEscrowSmartContract: <TClient extends Client>(client: TClient) => EscrowSmartContract<TClient>;
