import { Transaction } from '@neo-one/client-core';
export interface Transactions {
  readonly [hash: string]: Transaction | undefined;
}
export type Type = 'backup' | 'primary';
