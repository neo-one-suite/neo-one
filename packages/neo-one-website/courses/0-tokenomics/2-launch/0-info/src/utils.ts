// tslint:disable export-name no-empty no-unused
import BigNumber from 'bignumber.js';
// @ts-ignore
import { TokenSmartContract } from '../one/generated';

export interface TokenInfoResult {
  readonly name: string;
  readonly symbol: string;
  readonly amountPerNEO: BigNumber;
  readonly totalSupply: BigNumber;
  readonly remaining: BigNumber;
  readonly icoStartTimeSeconds: BigNumber;
  readonly icoDurationSeconds: BigNumber;
}

// @ts-ignore
export const getTokenInfo = async (token: TokenSmartContract): Promise<TokenInfoResult> => {
  // Implement me
};
