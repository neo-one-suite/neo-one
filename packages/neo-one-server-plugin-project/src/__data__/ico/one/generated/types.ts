/* @hash 4fe61ed1ec155170b977df3927670c05 */
// tslint:disable
/* eslint-disable */
import { ICOSmartContract } from './ICO/types';
import { TokenSmartContract } from './Token/types';

export interface Contracts {
  readonly ico: ICOSmartContract;
  readonly token: TokenSmartContract;
}
