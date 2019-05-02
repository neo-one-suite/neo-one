import { Hash256 } from '@neo-one/client-core';
import { Token } from './types';

export const TOKEN = 'token';

export interface AssetAsset {
  readonly type: 'asset';
  readonly value: string;
  readonly label: string;
}
export interface TokenAsset {
  readonly type: 'token';
  readonly value: string;
  readonly label: string;
  readonly token: Token;
}
export type Asset = AssetAsset | TokenAsset;

export const getTokenAsset = (token: Token): TokenAsset => ({
  type: 'token',
  token,
  label: token.symbol,
  value: token.address,
});

export const ASSETS: readonly Asset[] = [
  {
    type: 'asset',
    value: Hash256.NEO,
    label: 'NEO',
  },
  {
    type: 'asset',
    value: Hash256.GAS,
    label: 'GAS',
  },
];
