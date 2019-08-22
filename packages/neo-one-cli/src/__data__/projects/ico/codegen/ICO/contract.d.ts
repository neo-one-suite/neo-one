/* @hash 46896f2ccdc9914ec72842c48d6f1e84 */
// tslint:disable
/* eslint-disable */
import { Client } from '@neo-one/client';
import { ICOSmartContract } from './types';

export const createICOSmartContract: <TClient extends Client>(client: TClient) => ICOSmartContract<TClient>;
