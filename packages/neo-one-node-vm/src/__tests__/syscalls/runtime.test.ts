// tslint:disable no-object-mutation
import { common, crypto } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { blockTime, factory, keys, runSysCalls, scriptAttributeHash, TestCase, triggerType } from '../../__data__';
import { FEES } from '../../constants';
import {
  ArrayStackItem,
  BlockStackItem,
  BooleanStackItem,
  BufferStackItem,
  ConsensusPayloadStackItem,
  IntegerStackItem,
  NullStackItem,
  TransactionStackItem,
  UInt160StackItem,
  UInt256StackItem,
} from '../../stackItem';

const SYSCALLS: readonly TestCase[] = [
  {
    name: 'System.Runtime.GetTrigger',
    result: [new IntegerStackItem(new BN(triggerType))],
    gas: FEES[250],
  },

  {
    name: 'System.Runtime.CheckWitness',
    result: [new BooleanStackItem(true)],
    args: [scriptAttributeHash],
    gas: FEES[30_000],
  },

  {
    name: 'System.Runtime.CheckWitness',
    result: [new BooleanStackItem(false)],
    args: [keys[1].scriptHash],
    gas: FEES[30_000],
  },

  {
    name: 'System.Runtime.Notify',
    result: [],
    args: [[true]],
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Runtime.Log',
    result: [],
    args: ['foo'],
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Runtime.GetTime',
    result: [new IntegerStackItem(new BN(blockTime))],
    gas: FEES[250],
  },

  {
    name: 'System.Runtime.GetTime',
    result: [new IntegerStackItem(new BN(15000))],
    gas: FEES[250],
    flags: new Set(['noPersistingBlock']),
    mockBlockchain: ({ blockchain }) => {
      blockchain.currentBlock.timestamp = new BN(0);
      blockchain.settings.millisecondsPerBlock = 15000;
    },
  },

  {
    name: 'System.Runtime.GetInvocationCounter',
    result: [new IntegerStackItem(new BN(1))],

    gas: FEES[400],
  },

  {
    name: 'System.Runtime.GetNotifications',
    result: [
      new ArrayStackItem([
        new ArrayStackItem([
          new UInt160StackItem(common.bufferToUInt160(Buffer.alloc(20, 0))),
          new UInt256StackItem(common.bufferToUInt256(Buffer.alloc(32, 3))),
        ]),
        new ArrayStackItem([
          new UInt160StackItem(common.bufferToUInt160(Buffer.alloc(20, 1))),
          new ArrayStackItem([
            new UInt256StackItem(common.bufferToUInt256(Buffer.alloc(32, 3))),
            new BufferStackItem(Buffer.alloc(10, 0)),
          ]),
        ]),
      ]),
    ],
    options: {
      stack: [new BufferStackItem(Buffer.alloc(0, 0))],
      notifications: [
        {
          scriptHash: common.bufferToUInt160(Buffer.alloc(20, 0)),
          args: new UInt256StackItem(common.bufferToUInt256(Buffer.alloc(32, 3))),
        },
        {
          scriptHash: common.bufferToUInt160(Buffer.alloc(20, 1)),
          args: new ArrayStackItem([
            new UInt256StackItem(common.bufferToUInt256(Buffer.alloc(32, 3))),
            new BufferStackItem(Buffer.alloc(10, 0)),
          ]),
        },
      ],
    },
    gas: FEES[10_000],
  },

  {
    name: 'System.Runtime.GetNotifications',
    result: [
      new ArrayStackItem([
        new ArrayStackItem([
          new UInt160StackItem(common.bufferToUInt160(Buffer.alloc(20, 1))),
          new ArrayStackItem([
            new UInt256StackItem(common.bufferToUInt256(Buffer.alloc(32, 3))),
            new BufferStackItem(Buffer.alloc(10, 0)),
          ]),
        ]),
      ]),
    ],
    options: {
      stack: [new UInt160StackItem(common.bufferToUInt160(Buffer.alloc(20, 1)))],
      notifications: [
        {
          scriptHash: common.bufferToUInt160(Buffer.alloc(20, 0)),
          args: new UInt256StackItem(common.bufferToUInt256(Buffer.alloc(32, 3))),
        },
        {
          scriptHash: common.bufferToUInt160(Buffer.alloc(20, 1)),
          args: new ArrayStackItem([
            new UInt256StackItem(common.bufferToUInt256(Buffer.alloc(32, 3))),
            new BufferStackItem(Buffer.alloc(10, 0)),
          ]),
        },
      ],
    },
    gas: FEES[10_000],
  },

  {
    name: 'System.Runtime.GetScriptContainer',
    result: ({ transaction }) => [new TransactionStackItem(transaction)],
    gas: FEES[250],
  },

  {
    name: 'System.Runtime.GetScriptContainer',
    flags: new Set(['blockContainer']),
    result: [new BlockStackItem(factory.createBlock({ timestamp: new BN(15) }))],
    gas: FEES[250],
  },

  {
    name: 'System.Runtime.GetScriptContainer',
    flags: new Set(['consensusContainer']),
    result: [new ConsensusPayloadStackItem(factory.createConsensusPayload({ timestamp: 15 }))],
    gas: FEES[250],
  },

  {
    name: 'System.Runtime.GetExecutingScriptHash',
    result: ({ transaction }) => [new UInt160StackItem(crypto.toScriptHash(transaction.script))],

    gas: FEES[400],
  },

  {
    name: 'System.Runtime.GetCallingScriptHash',
    result: [new NullStackItem()],
    gas: FEES[400],
  },
  {
    name: 'System.Runtime.GetCallingScriptHash',
    result: [new UInt160StackItem(common.ZERO_UINT160)],
    gas: FEES[400],
    options: {
      scriptHashStack: [
        common.bufferToUInt160(Buffer.alloc(20, 1)),
        common.ZERO_UINT160,
        common.bufferToUInt160(Buffer.alloc(20, 2)),
      ],
    },
  },

  {
    name: 'System.Runtime.GetEntryScriptHash',
    result: [new UInt160StackItem(common.ZERO_UINT160)],
    options: {
      scriptHashStack: [
        common.bufferToUInt160(Buffer.alloc(20, 1)),
        common.bufferToUInt160(Buffer.alloc(20, 2)),
        common.ZERO_UINT160,
      ],
    },
    gas: FEES[400],
  },
];

describe('SysCalls: System.Runtime', () => {
  runSysCalls(SYSCALLS);
});
