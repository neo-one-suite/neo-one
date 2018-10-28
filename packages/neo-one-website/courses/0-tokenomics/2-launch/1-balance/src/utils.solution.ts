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

export const getTokenInfo = async (token: TokenSmartContract, address?: AddressString): Promise<TokenInfoResult> => {
  const [
    name,
    symbol,
    amountPerNEO,
    totalSupply,
    remaining,
    icoStartTimeSeconds,
    icoDurationSeconds,
    balance,
  ] = await Promise.all([
    token.name(),
    token.symbol(),
    token.amountPerNEO(),
    token.totalSupply(),
    token.remaining(),
    token.icoStartTimeSeconds(),
    token.icoDurationSeconds(),
    address === undefined ? Promise.resolve(new BigNumber(0)) : token.balanceOf(address),
  ]);

  return { name, symbol, amountPerNEO, totalSupply, remaining, icoStartTimeSeconds, icoDurationSeconds, balance };
};
