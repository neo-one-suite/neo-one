// tslint:disable export-name no-empty no-unused no-implicit-dependencies
import { AddressString } from '@neo-one/client';
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
  readonly balance: BigNumber;
}

// @ts-ignore
export const getTokenInfo = async (token: TokenSmartContract, address?: AddressString): Promise<TokenInfoResult> => {
  const [
    name,
    symbol,
    amountPerNEO,
    totalSupply,
    remaining,
    icoStartTimeSeconds,
    icoDurationSeconds,
  ] = await Promise.all([
    token.name(),
    token.symbol(),
    token.amountPerNEO(),
    token.totalSupply(),
    token.remaining(),
    token.icoStartTimeSeconds(),
    token.icoDurationSeconds(),
  ]);

  // @ts-ignore
  return { name, symbol, amountPerNEO, totalSupply, remaining, icoStartTimeSeconds, icoDurationSeconds };
};
