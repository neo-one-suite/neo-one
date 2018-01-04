/* @flow */
import type { Transaction, UInt256Hex } from '@neo-one/client-core';

export type Transactions = { [hash: UInt256Hex]: Transaction };
export type Type = 'backup' | 'primary';
