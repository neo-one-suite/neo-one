// tslint:disable no-object-mutation
import { common } from '@neo-one/client-common';
import { Block, ConsensusData } from '@neo-one/node-core';
import { BN } from 'bn.js';
import { keys, runSysCalls, scriptAttributeHash, TestCase, transactions } from '../../__data__';
import { FEES } from '../../constants';
import {
  BlockStackItem,
  ContractStackItem,
  IntegerStackItem,
  NullStackItem,
  TransactionStackItem,
} from '../../stackItem';

const blockBase = {
  version: 0,
  previousHash: common.bufferToUInt256(Buffer.alloc(32, 0)),
  merkleRoot: common.bufferToUInt256(Buffer.alloc(32, 1)),
  timestamp: new BN(1),
  index: 2,
  consensusData: new ConsensusData({
    primaryIndex: 1,
    nonce: new BN(10),
  }),
  nextConsensus: keys[1].scriptHash,
  hash: common.bufferToUInt256(Buffer.alloc(32, 2)),
};

const dummyBlock = {
  ...blockBase,
  transactions: [transactions.kycTransaction, transactions.mintTransaction],
};

const SYSCALLS: readonly TestCase[] = [
  {
    name: 'System.Blockchain.GetHeight',
    result: [new IntegerStackItem(new BN(10))],
    mockBlockchain: ({ blockchain }) => {
      blockchain.currentBlock.index = 10;
    },
    gas: FEES[400],
  },

  {
    name: 'System.Blockchain.GetBlock',
    result: [new BlockStackItem(new Block(dummyBlock))],
    args: [Buffer.alloc(32, 3)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.block.get = jest.fn(async () => Promise.resolve(new Block(dummyBlock)));
    },
    gas: FEES[2_500_000],
  },

  {
    name: 'System.Blockchain.GetBlock',
    result: [new BlockStackItem(new Block(dummyBlock))],
    args: [Buffer.alloc(6, 0)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.block.get = jest.fn(async () => Promise.resolve(new Block(dummyBlock)));
    },
    gas: FEES[2_500_000],
    error: 'Invalid GETBLOCK Argument',
  },

  {
    name: 'System.Blockchain.GetTransaction',
    result: [new TransactionStackItem(transactions.mintTransaction)],
    args: [Buffer.alloc(32, 3)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Blockchain.GetTransactionHeight',
    result: [new IntegerStackItem(new BN(10))],
    args: [Buffer.alloc(32, 3)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.transactionData.get = jest.fn(async () => Promise.resolve({ startHeight: 10 }));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Blockchain.GetTransactionFromBlock',
    result: [new TransactionStackItem(transactions.kycTransaction)],
    args: [Buffer.alloc(32, 3), new BN(0)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.block.tryGet = jest.fn(async () => Promise.resolve(new Block(dummyBlock)));
      blockchain.transaction.tryGet = jest.fn(async () => Promise.resolve(transactions.kycTransaction));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Blockchain.GetTransactionFromBlock',
    result: [new TransactionStackItem(transactions.mintTransaction)],
    args: [Buffer.alloc(32, 3), new BN(1)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.block.tryGet = jest.fn(async () => Promise.resolve(new Block(dummyBlock)));
      blockchain.transaction.tryGet = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Blockchain.GetTransactionFromBlock',
    result: [new TransactionStackItem(transactions.mintTransaction)],
    args: [Buffer.alloc(32, 3), new BN(2)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.block.tryGet = jest.fn(async () => Promise.resolve(new Block(dummyBlock)));
      blockchain.transaction.tryGet = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES[1_000_000],
    error: 'Invalid Transaction Index Argument: 2. Transactions length: 2',
  },

  {
    name: 'System.Blockchain.GetTransactionFromBlock',
    result: [new TransactionStackItem(transactions.mintTransaction)],
    args: [Buffer.alloc(32, 3), new BN(-1)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.block.tryGet = jest.fn(async () => Promise.resolve(new Block(dummyBlock)));
      blockchain.transaction.tryGet = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES[1_000_000],
    error: 'Invalid Transaction Index Argument: -1. Transactions length: 2',
  },

  {
    name: 'System.Blockchain.GetContract',
    result: [new ContractStackItem(transactions.kycContract)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve(transactions.kycContract));
    },
    args: [scriptAttributeHash],
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Blockchain.GetContract',
    result: [new NullStackItem()],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve(undefined));
    },
    args: [scriptAttributeHash],
    gas: FEES[1_000_000],
  },
];

describe('SysCalls: System.Blockchain', () => {
  runSysCalls(SYSCALLS);
});
