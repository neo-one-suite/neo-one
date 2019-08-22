/* @hash 3195fa7fcc28cc959230df1d5145206d */
// tslint:disable
/* eslint-disable */
import { Client } from '@neo-one/client';
import { TokenSmartContract } from './types';

export const createTokenSmartContract: <TClient extends Client>(client: TClient) => TokenSmartContract<TClient>;
