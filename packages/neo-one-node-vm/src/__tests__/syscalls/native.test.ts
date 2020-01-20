// tslint:disable no-object-mutation
import { common } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { runSysCalls, TestCase } from '../../__data__';
import { FEES } from '../../constants';
import { ArrayStackItem, BooleanStackItem, IntegerStackItem, UInt160StackItem } from '../../stackItem';

const SYSCALLS: readonly TestCase[] = [
  {
    name: 'Neo.Native.Deploy',
    result: [],
    args: [],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.add = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
    },
    gas: FEES[400],
  },

  {
    name: 'Neo.Native.Policy',
    result: [new IntegerStackItem(new BN(10))],
    args: ['getMaxTransactionsPerBlock', []],
    mockBlockchain: ({ blockchain }) => {
      blockchain.storageItem.get = jest.fn(async () => Promise.resolve({ value: new BN(10) }));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Native.Policy',
    result: [new IntegerStackItem(new BN(5))],
    args: ['getMaxBlockSize', []],
    mockBlockchain: ({ blockchain }) => {
      blockchain.storageItem.get = jest.fn(async () => Promise.resolve({ value: new BN(5) }));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Native.Policy',
    result: [new IntegerStackItem(new BN(15))],
    args: ['getFeePerByte', []],
    mockBlockchain: ({ blockchain }) => {
      blockchain.storageItem.get = jest.fn(async () => Promise.resolve({ value: new BN(15) }));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Native.Policy',
    result: [
      new ArrayStackItem([
        new UInt160StackItem(common.bufferToUInt160(Buffer.alloc(20, 1))),
        new UInt160StackItem(common.bufferToUInt160(Buffer.alloc(20, 0))),
      ]),
    ],
    args: ['getBlockedAccounts', []],
    mockBlockchain: ({ blockchain }) => {
      blockchain.storageItem.get = jest.fn(async () =>
        Promise.resolve({ value: Buffer.concat([Buffer.alloc(20, 1), Buffer.alloc(20, 0)]) }),
      );
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Native.Policy',
    result: [new BooleanStackItem(true)],
    args: ['setMaxBlockSize', [new BN(10)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.storageItem.get = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.update = jest.fn(async () => Promise.resolve());
    },
    gas: FEES[3_000_000],
  },

  {
    name: 'Neo.Native.Policy',
    result: [new BooleanStackItem(true)],
    args: ['setMaxTransactionsPerBlock', [new BN(5)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.storageItem.get = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.update = jest.fn(async () => Promise.resolve());
    },
    gas: FEES[3_000_000],
  },

  {
    name: 'Neo.Native.Policy',
    result: [new BooleanStackItem(true)],
    args: ['setFeePerByte', [new BN(10)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.storageItem.get = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.update = jest.fn(async () => Promise.resolve());
    },
    gas: FEES[3_000_000],
  },

  {
    name: 'Neo.Native.Policy',
    result: [new BooleanStackItem(true)],
    args: ['blockAccount', [Buffer.alloc(20, 1)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.storageItem.get = jest.fn(async () => Promise.resolve({ value: Buffer.alloc(20, 0) }));
      blockchain.storageItem.update = jest.fn(async () => Promise.resolve());
    },
    gas: FEES[3_000_000],
  },

  {
    name: 'Neo.Native.Policy',
    result: [new BooleanStackItem(true)],
    args: ['unblockAccount', [Buffer.alloc(20, 1)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.storageItem.get = jest.fn(async () => Promise.resolve({ value: Buffer.alloc(20, 1) }));
      blockchain.storageItem.update = jest.fn(async () => Promise.resolve());
    },
    gas: FEES[3_000_000],
  },
];

describe('SysCalls: Neo.Native', () => {
  runSysCalls(SYSCALLS);
});
