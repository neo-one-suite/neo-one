/* @hash ae16fcc785175ceb0e76d15224760470 */
// tslint:disable
/* eslint-disable */
import { EscrowSmartContract } from './Escrow/types';
import { ICOSmartContract } from './ICO/types';
import { TokenSmartContract } from './Token/types';

export interface Contracts {
  readonly escrow: EscrowSmartContract;
  readonly ico: ICOSmartContract;
  readonly token: TokenSmartContract;
}
