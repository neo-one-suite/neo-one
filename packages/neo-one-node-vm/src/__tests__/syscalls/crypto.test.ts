// tslint:disable no-object-mutation
import { crypto } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { keys, runSysCalls, TestCase } from '../../__data__';
import { FEES } from '../../constants';
import { BooleanStackItem } from '../../stackItem';

const signature0 = crypto.sign({
  message: Buffer.alloc(32, 10),
  privateKey: keys[0].privateKey,
});

const signature1 = crypto.sign({
  message: Buffer.alloc(32, 10),
  privateKey: keys[1].privateKey,
});

const SYSCALLS: readonly TestCase[] = [
  {
    name: 'Neo.Crypto.ECDsaVerify',
    result: [new BooleanStackItem(true)],
    args: [keys[0].publicKey, signature0],
    mockTransaction: ({ transaction }) => {
      transaction.messageInternal = jest.fn(() => Buffer.alloc(32, 10));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Crypto.ECDsaVerify',
    result: [new BooleanStackItem(false)],
    args: [keys[0].publicKey, Buffer.alloc(64, 10)],
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Crypto.ECDsaCheckMultiSig',
    result: [new BooleanStackItem(true)],
    args: [
      [keys[0].publicKey, keys[1].publicKey],
      [signature0, signature1],
    ],
    mockTransaction: ({ transaction }) => {
      transaction.messageInternal = jest.fn(() => Buffer.alloc(32, 10));
    },
    gas: FEES[1_000_000].mul(new BN(2)),
  },

  {
    name: 'Neo.Crypto.ECDsaCheckMultiSig',
    result: [new BooleanStackItem(true)],
    args: [new BN(2), keys[0].publicKey, keys[1].publicKey, new BN(2), signature0, signature1],
    mockTransaction: ({ transaction }) => {
      transaction.messageInternal = jest.fn(() => Buffer.alloc(32, 10));
    },
    gas: FEES[1_000_000].mul(new BN(2)),
  },

  {
    name: 'Neo.Crypto.ECDsaCheckMultiSig',
    result: [new BooleanStackItem(true)],
    args: [
      [keys[0].publicKey, keys[2].publicKey, keys[1].publicKey],
      [signature0, signature1],
    ],
    mockTransaction: ({ transaction }) => {
      transaction.messageInternal = jest.fn(() => Buffer.alloc(32, 10));
    },
    gas: FEES[1_000_000].mul(new BN(3)),
  },

  {
    name: 'Neo.Crypto.ECDsaCheckMultiSig',
    result: [new BooleanStackItem(true)],
    args: [new BN(3), keys[0].publicKey, keys[2].publicKey, keys[1].publicKey, new BN(2), signature0, signature1],
    mockTransaction: ({ transaction }) => {
      transaction.messageInternal = jest.fn(() => Buffer.alloc(32, 10));
    },
    gas: FEES[1_000_000].mul(new BN(3)),
  },

  {
    name: 'Neo.Crypto.ECDsaCheckMultiSig',
    result: [new BooleanStackItem(false)],
    args: [[keys[0].publicKey, keys[1].publicKey], [Buffer.alloc(64, 10)]],
    gas: FEES[1_000_000].mul(new BN(2)),
  },

  {
    name: 'Neo.Crypto.ECDsaCheckMultiSig',
    result: [new BooleanStackItem(false)],
    args: [new BN(2), keys[0].publicKey, keys[1].publicKey, new BN(1), Buffer.alloc(64, 10)],
    mockTransaction: ({ transaction }) => {
      transaction.messageInternal = jest.fn(() => Buffer.alloc(32, 10));
    },
    gas: FEES[1_000_000].mul(new BN(2)),
  },
];

describe('SysCalls: Neo.Crypto', () => {
  runSysCalls(SYSCALLS);
});
