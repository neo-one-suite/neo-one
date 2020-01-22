// tslint:disable no-object-mutation
import { common } from '@neo-one/client-common';
import { ContractPropertyState, createContract, createContractManifest } from '@neo-one/node-core';
import { BN } from 'bn.js';
import { keys, runSysCalls, TestCase } from '../../__data__';
import { FEES } from '../../constants';
import { ArrayStackItem, BooleanStackItem, IntegerStackItem, StringStackItem, UInt160StackItem } from '../../stackItem';

const contract = createContract({
  manifest: createContractManifest({
    features: ContractPropertyState.HasStorage,
  }),
});

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

  {
    name: 'Neo.Native.Tokens.GAS',
    result: [new StringStackItem('GAS')],
    args: ['name', []],
    gas: FEES[0],
  },

  {
    name: 'Neo.Native.Tokens.GAS',
    result: [new StringStackItem('gas')],
    args: ['symbol', []],
    gas: FEES[0],
  },

  {
    name: 'Neo.Native.Tokens.GAS',
    result: [new IntegerStackItem(new BN(8))],
    args: ['decimals', []],
    gas: FEES[0],
  },

  {
    name: 'Neo.Native.Tokens.GAS',
    result: [new IntegerStackItem(new BN(1500))],
    args: ['totalSupply', []],
    mockBlockchain: ({ blockchain }) => {
      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ value: new BN(1500) }));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Native.Tokens.GAS',
    result: [new IntegerStackItem(new BN(12))],
    args: ['balanceOf', [Buffer.alloc(20, 1)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ value: new BN(12) }));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Native.Tokens.GAS',
    result: [new IntegerStackItem(new BN(1200))],
    args: ['getSysFeeAmount', [new BN(5)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ value: new BN(1200) }));
    },
    gas: FEES[0],
  },

  {
    name: 'Neo.Native.Tokens.GAS',
    result: [new IntegerStackItem(new BN(0))],
    args: ['getSysFeeAmount', [new BN(5)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
    },
    gas: FEES[0],
  },

  // Amount less than 0
  {
    name: 'Neo.Native.Tokens.GAS',
    result: [],
    args: ['transfer', [keys[0].scriptHash, Buffer.alloc(20, 0), new BN(-1)]],
    gas: FEES[8_000_000],
    error: `VM Error: Native NEP5 Contract expected amount`,
  },

  // context.scriptHash !== from
  {
    name: 'Neo.Native.Tokens.GAS',
    result: [new BooleanStackItem(false)],
    args: ['transfer', [Buffer.alloc(20, 1), Buffer.alloc(20, 0), new BN(10)]],
    gas: FEES[8_000_000],
  },

  // to is a contract without payable feature
  {
    name: 'Neo.Native.Tokens.GAS',
    result: [new BooleanStackItem(false)],
    args: ['transfer', [keys[0].scriptHash, Buffer.alloc(20, 0), new BN(10)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve(contract));
    },
    gas: FEES[8_000_000],
  },

  // 0 amount
  {
    name: 'Neo.Native.Tokens.GAS',
    result: [new BooleanStackItem(true)],
    args: ['transfer', [keys[0].scriptHash, Buffer.alloc(20, 0), new BN(0)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ value: new BN(12) }));
    },
    gas: FEES[8_000_000],
  },

  // from has no storage/balance
  {
    name: 'Neo.Native.Tokens.GAS',
    result: [new BooleanStackItem(false)],
    args: ['transfer', [keys[0].scriptHash, Buffer.alloc(20, 0), new BN(5)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
    },
    gas: FEES[8_000_000],
  },

  // from has less balance than amount
  {
    name: 'Neo.Native.Tokens.GAS',
    result: [new BooleanStackItem(false)],
    args: ['transfer', [keys[0].scriptHash, Buffer.alloc(20, 0), new BN(5)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ value: new BN(3) }));
    },
    gas: FEES[8_000_000],
  },

  // from === to
  {
    name: 'Neo.Native.Tokens.GAS',
    result: [new BooleanStackItem(true)],
    args: ['transfer', [keys[0].scriptHash, keys[0].scriptHash, new BN(5)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ value: new BN(5) }));
    },
    gas: FEES[8_000_000],
  },

  // amount equal to from balance & to storage undefined
  {
    name: 'Neo.Native.Tokens.GAS',
    result: [new BooleanStackItem(true)],
    args: ['transfer', [keys[0].scriptHash, Buffer.alloc(20, 0), new BN(5)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.tryGet = jest
        .fn()
        .mockImplementationOnce(async () => Promise.resolve({ value: new BN(5) }))
        .mockImplementationOnce(async () => Promise.resolve());
      blockchain.storageItem.delete = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: FEES[8_000_000],
  },

  // from & to have nonzero balances not equal to amount
  {
    name: 'Neo.Native.Tokens.GAS',
    result: [new BooleanStackItem(true)],
    args: ['transfer', [keys[0].scriptHash, Buffer.alloc(20, 0), new BN(3)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.tryGet = jest
        .fn()
        .mockImplementationOnce(async () => Promise.resolve({ value: new BN(5) }))
        .mockImplementationOnce(async () => Promise.resolve({ value: new BN(14) }));
      blockchain.storageItem.update = jest.fn(async () => Promise.resolve());
    },
    gas: FEES[8_000_000],
  },

  {
    name: 'Neo.Native.Tokens.NEO',
    result: [new StringStackItem('NEO')],
    args: ['name', []],
    gas: FEES[0],
  },

  {
    name: 'Neo.Native.Tokens.NEO',
    result: [new StringStackItem('neo')],
    args: ['symbol', []],
    gas: FEES[0],
  },

  {
    name: 'Neo.Native.Tokens.NEO',
    result: [new IntegerStackItem(new BN(0))],
    args: ['decimals', []],
    gas: FEES[0],
  },

  {
    name: 'Neo.Native.Tokens.NEO',
    result: [new IntegerStackItem(new BN(2500))],
    args: ['totalSupply', []],
    mockBlockchain: ({ blockchain }) => {
      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ value: new BN(2500) }));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Native.Tokens.NEO',
    result: [new IntegerStackItem(new BN(12000))],
    args: ['balanceOf', [Buffer.alloc(20, 1)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ value: new BN(12000) }));
    },
    gas: FEES[1_000_000],
  },

  // Amount less than 0
  {
    name: 'Neo.Native.Tokens.NEO',
    result: [],
    args: ['transfer', [keys[0].scriptHash, Buffer.alloc(20, 0), new BN(-1)]],
    gas: FEES[8_000_000],
    error: `VM Error: Native NEP5 Contract expected amount`,
  },

  // context.scriptHash !== from
  {
    name: 'Neo.Native.Tokens.NEO',
    result: [new BooleanStackItem(false)],
    args: ['transfer', [Buffer.alloc(20, 1), Buffer.alloc(20, 0), new BN(10)]],
    gas: FEES[8_000_000],
  },

  // to is a contract without payable feature
  {
    name: 'Neo.Native.Tokens.NEO',
    result: [new BooleanStackItem(false)],
    args: ['transfer', [keys[0].scriptHash, Buffer.alloc(20, 0), new BN(10)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve(contract));
    },
    gas: FEES[8_000_000],
  },

  // 0 amount
  {
    name: 'Neo.Native.Tokens.NEO',
    result: [new BooleanStackItem(true)],
    args: ['transfer', [keys[0].scriptHash, Buffer.alloc(20, 0), new BN(0)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ value: new BN(12) }));
    },
    gas: FEES[8_000_000],
  },

  // from has no storage/balance
  {
    name: 'Neo.Native.Tokens.NEO',
    result: [new BooleanStackItem(false)],
    args: ['transfer', [keys[0].scriptHash, Buffer.alloc(20, 0), new BN(5)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
    },
    gas: FEES[8_000_000],
  },

  // from has less balance than amount
  {
    name: 'Neo.Native.Tokens.NEO',
    result: [new BooleanStackItem(false)],
    args: ['transfer', [keys[0].scriptHash, Buffer.alloc(20, 0), new BN(5)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ value: new BN(3) }));
    },
    gas: FEES[8_000_000],
  },

  // from === to
  {
    name: 'Neo.Native.Tokens.NEO',
    result: [new BooleanStackItem(true)],
    args: ['transfer', [keys[0].scriptHash, keys[0].scriptHash, new BN(5)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ value: new BN(5) }));
    },
    gas: FEES[8_000_000],
  },

  // amount equal to from balance & to storage undefined
  {
    name: 'Neo.Native.Tokens.NEO',
    result: [new BooleanStackItem(true)],
    args: ['transfer', [keys[0].scriptHash, Buffer.alloc(20, 0), new BN(5)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.tryGet = jest
        .fn()
        .mockImplementationOnce(async () => Promise.resolve({ value: new BN(5) }))
        .mockImplementationOnce(async () => Promise.resolve());
      blockchain.storageItem.delete = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: FEES[8_000_000],
  },

  // from & to have nonzero balances not equal to amount
  {
    name: 'Neo.Native.Tokens.NEO',
    result: [new BooleanStackItem(true)],
    args: ['transfer', [keys[0].scriptHash, Buffer.alloc(20, 0), new BN(3)]],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.tryGet = jest
        .fn()
        .mockImplementationOnce(async () => Promise.resolve({ value: new BN(5) }))
        .mockImplementationOnce(async () => Promise.resolve({ value: new BN(14) }));
      blockchain.storageItem.update = jest.fn(async () => Promise.resolve());
    },
    gas: FEES[8_000_000],
  },
];

describe('SysCalls: Neo.Native', () => {
  runSysCalls(SYSCALLS);
});
