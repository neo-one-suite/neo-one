/* @flow */
import type { Transaction, UInt256Hex } from '@neo-one/core';

export type Transactions = { [hash: UInt256Hex]: Transaction };
export type Type = 'backup' | 'primary';
