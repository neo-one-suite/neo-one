// tslint:disable
import { ICOSmartContract } from './ICO/types';
import { TokenSmartContract } from './Token/types';

export interface Contracts {
  readonly ico: ICOSmartContract;
  readonly token: TokenSmartContract;
}
