// tslint:disable export-name no-empty no-unused no-implicit-dependencies
import { AddressString, InvokeReceipt } from '@neo-one/client-common';
import { Client, Hash256 } from '@neo-one/client-core';
import BigNumber from 'bignumber.js';
import { combineLatest, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
// @ts-ignore
import { TokenEvent, TokenSmartContract } from '../one/generated';

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

export const handleMint = async (
  token: TokenSmartContract,
  amount: BigNumber,
): Promise<InvokeReceipt<boolean, TokenEvent>> => {
  const result = await token.mintTokens({
    sendTo: [
      {
        asset: Hash256.NEO,
        amount,
      },
    ],
  });

  return result.confirmed();
};

export const createTokenInfoStream$ = (client: Client, token: TokenSmartContract): Observable<TokenInfoResult> =>
  combineLatest(client.currentUserAccount$, client.block$).pipe(
    switchMap(async ([userAccount]) =>
      getTokenInfo(token, userAccount === undefined ? undefined : userAccount.id.address),
    ),
  );

export const handleTransfer = async (
  token: TokenSmartContract,
  from: AddressString,
  to: AddressString,
  amount: BigNumber,
  // @ts-ignore
): Promise<InvokeReceipt<boolean, TokenEvent>> => token.transfer.confirmed(from, to, amount);

export const handleWithdraw = async (
  client: Client,
  token: TokenSmartContract,
  // @ts-ignore
): Promise<void> => {
  // Implement me
};
