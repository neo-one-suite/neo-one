// tslint:disable no-object-mutation
import { BinaryWriter, common, crypto, OpCode, Param, ScriptBuilder, SysCallName } from '@neo-one/client-common';
import {
  AttributeUsage,
  Block,
  ConsensusData,
  createContract,
  createContractAbi,
  createContractManifest,
  NULL_ACTION,
  ScriptContainerType,
  StorageFlags,
  StorageItem,
  Transaction,
  TriggerType,
  UInt160Attribute,
  utils,
  WriteBlockchain,
} from '@neo-one/node-core';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { BN } from 'bn.js';
import { of } from 'rxjs';
import { factory, keys, testUtils, transactions } from '../__data__';
import { ExecutionInit, FEES, Options } from '../constants';
import { executeScript } from '../execute';
import {
  ArrayStackItem,
  BlockStackItem,
  BooleanStackItem,
  BufferStackItem,
  ConsensusPayloadStackItem,
  ContractStackItem,
  IntegerStackItem,
  IteratorStackItem,
  MapStackItem,
  NullStackItem,
  StackItem,
  StackItemIterator,
  StackItemType,
  StorageContextStackItem,
  StringStackItem,
  TransactionStackItem,
  UInt160StackItem,
  UInt256StackItem,
} from '../stackItem';

type flag = 'blockContainer' | 'consensusContainer' | 'useBadTransaction' | 'noPersistingBlock';

const testArray: readonly number[] = [1, 2, 3];
const testIterator: ReadonlyArray<{ readonly key: IntegerStackItem; readonly value: IntegerStackItem }> = [
  { key: new IntegerStackItem(new BN(0)), value: new IntegerStackItem(new BN(1)) },
  { key: new IntegerStackItem(new BN(1)), value: new IntegerStackItem(new BN(2)) },
  { key: new IntegerStackItem(new BN(2)), value: new IntegerStackItem(new BN(3)) },
];
const testAsyncIterable = AsyncIterableX.from(testIterator);

const triggerType = TriggerType.Application;
const scriptAttributeHash = keys[0].scriptHash;
const blockTime = new BN(Date.now());
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

const nextItem = new StorageItem({
  value: Buffer.from('val', 'utf-8'),
  isConstant: false,
  // hash: scriptAttributeHash,
  // key: Buffer.from('key', 'utf-8'),
  // flags: StorageFlags.None,
});

const signature0 = crypto.sign({
  message: Buffer.alloc(32, 10),
  privateKey: keys[0].privateKey,
});

const signature1 = crypto.sign({
  message: Buffer.alloc(32, 10),
  privateKey: keys[1].privateKey,
});

// Helpers
export const createKeysMap = (stackArray: readonly StackItem[]): Map<string, StackItem> => {
  const map = new Map<string, StackItem>();
  stackArray.forEach((key) => map.set(key.toStructuralKey(), key));

  return map;
};
export const createValuesMap = (
  keysArray: readonly StackItem[],
  valuesArray: readonly StackItem[],
): Map<string, StackItem> => {
  const map = new Map();
  keysArray.forEach((key, i) => map.set(key.toStructuralKey(), valuesArray[i]));

  return map;
};

// Simple JSON
export const simpleJson = { key: 'value' };
export const simpleJsonKey = new StringStackItem('key');
export const simpleJsonValue = new StringStackItem('value');
export const simpleJsonKeys: ReadonlyArray<StackItem> = [simpleJsonKey];
export const simpleJsonValues: ReadonlyArray<StackItem> = [simpleJsonValue];
export const simpleMapStackItem = new MapStackItem({
  referenceKeys: createKeysMap(simpleJsonKeys),
  referenceValues: createValuesMap(simpleJsonKeys, simpleJsonValues),
});
export const simpleJsonToBuffer = Buffer.from(JSON.stringify(simpleJson));

// Nested JSON
export const nestedJson = {
  // tslint:disable-next-line: no-null-keyword
  first: { second: ['string', 10, true], third: null, fourth: 'string', fifth: 10, sixth: false },
};
export const secondKey = new StringStackItem('second');
export const thirdKey = new StringStackItem('third');
export const fourthKey = new StringStackItem('fourth');
export const fifthKey = new StringStackItem('fifth');
export const sixthKey = new StringStackItem('sixth');
export const nestedJsonKeys: ReadonlyArray<StackItem> = [secondKey, thirdKey, fourthKey, fifthKey, sixthKey];
export const secondValue = new ArrayStackItem([
  new StringStackItem('string'),
  new IntegerStackItem(new BN(10)),
  new BooleanStackItem(true),
]);
export const thirdValue = new NullStackItem();
export const fourthValue = new StringStackItem('string');
export const fifthValue = new IntegerStackItem(new BN(10));
export const sixthValue = new BooleanStackItem(false);
export const nestedJsonValues: ReadonlyArray<StackItem> = [
  secondValue,
  thirdValue,
  fourthValue,
  fifthValue,
  sixthValue,
];
export const outerNestedJsonKeys: ReadonlyArray<StackItem> = [new StringStackItem('first')];
export const outerNestedJsonValues: ReadonlyArray<StackItem> = [
  new MapStackItem({
    referenceKeys: createKeysMap(nestedJsonKeys),
    referenceValues: createValuesMap(nestedJsonKeys, nestedJsonValues),
  }),
];
export const nestedMapStackItem = new MapStackItem({
  referenceKeys: createKeysMap(outerNestedJsonKeys),
  referenceValues: createValuesMap(outerNestedJsonKeys, outerNestedJsonValues),
});
export const nestedJsonToBuffer = Buffer.from(JSON.stringify(nestedJson));

const callingContract = createContract();

const contractToCallSB = new ScriptBuilder();
contractToCallSB.emitOp('PUSH3');
contractToCallSB.emitOp('PUSH2');
const contractToCall = createContract({
  script: contractToCallSB.build(),
  manifest: createContractManifest({
    abi: createContractAbi({
      hash: common.bufferToUInt160(Buffer.from('3775292229eccdf904f16fff8e83e7cffdc0f0ce', 'hex')),
    }),
  }),
});

interface SysCall {
  readonly name: SysCallName;
  readonly type: 'sys';

  readonly args?: readonly Arg[];
}

interface OpCall {
  readonly name: OpCode;
  readonly type: 'op';

  readonly args?: readonly Arg[];
  readonly buffer?: Buffer;
}
type Call = SysCall | OpCall;

interface Calls {
  readonly type: 'calls';
  readonly calls: readonly Call[];
}
type Arg = Param | undefined | Calls;

interface TestCase {
  readonly name: SysCallName;
  readonly result:
    | readonly StackItem[]
    | ((options: {
        readonly transaction: Transaction;
      }) => // tslint:disable-next-line no-any
      readonly StackItem[] | ((result: any) => void));

  readonly gas: BN;
  readonly args?: readonly Arg[];
  readonly options?: Options;
  // tslint:disable-next-line no-any
  readonly mockBlockchain?: (options: { readonly blockchain: any }) => void;
  // tslint:disable-next-line no-any
  readonly mockTransaction?: (options: { readonly transaction: any }) => void;
  readonly error?: string;
  readonly flags?: Set<flag>;
}

const SYSCALLS = [
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
    gas: FEES[250],
  },

  {
    name: 'System.Runtime.Log',
    result: [],
    args: ['foo'],
    gas: FEES[30_0000],
  },

  {
    name: 'System.Runtime.GetTime',
    result: [new IntegerStackItem(new BN(blockTime))],
    gas: FEES[250],
  },

  {
    name: 'System.Runtime.GetTime',
    result: [new IntegerStackItem(new BN(15))],
    gas: FEES[250],
    flags: new Set(['noPersistingBlock']),
    mockBlockchain: ({ blockchain }) => {
      blockchain.currentBlock.timestamp = 0;
      blockchain.settings.secondsPerBlock = 15;
    },
  },

  {
    name: 'System.Runtime.Serialize',
    result: [
      new BufferStackItem(
        new BinaryWriter()
          .writeUInt8(StackItemType.ByteArray)
          .writeVarBytesLE(Buffer.alloc(10, 1))
          .toBuffer(),
      ),
    ],

    args: [Buffer.alloc(10, 1)],
    gas: FEES[100_000],
  },

  {
    name: 'System.Runtime.Serialize',
    result: [
      new BufferStackItem(
        new BinaryWriter()
          .writeUInt8(StackItemType.ByteArray)
          .writeVarBytesLE(Buffer.alloc(10, 1))
          .toBuffer(),
      ),
    ],

    args: [Buffer.alloc(10, 1)],
    gas: FEES[100_000],
  },

  // This one is a bit odd because true turns into emitting an integer
  // stack item.
  {
    name: 'System.Runtime.Serialize',
    result: [
      new BufferStackItem(
        new BinaryWriter()
          .writeUInt8(StackItemType.Integer)
          .writeVarBytesLE(Buffer.alloc(1, 1))
          .toBuffer(),
      ),
    ],

    args: [true],
    gas: FEES[100_000],
  },

  {
    name: 'System.Runtime.Serialize',
    result: [
      new BufferStackItem(
        new BinaryWriter()
          .writeUInt8(StackItemType.ByteArray)
          .writeVarBytesLE(utils.toSignedBuffer(new BN('10000000000000', 10)))
          .toBuffer(),
      ),
    ],

    args: [new BN('10000000000000', 10)],
    gas: FEES[100_000],
  },

  {
    name: 'System.Runtime.Serialize',
    result: [
      new BufferStackItem(
        new BinaryWriter()
          .writeUInt8(StackItemType.Array)
          .writeVarUIntLE(1)
          .writeBytes(
            new BinaryWriter()
              .writeUInt8(StackItemType.ByteArray)
              .writeVarBytesLE(utils.toSignedBuffer(new BN('10000000000000', 10)))
              .toBuffer(),
          )
          .toBuffer(),
      ),
    ],

    args: [[new BN('10000000000000', 10)]],
    gas: FEES[100_000],
  },

  {
    name: 'System.Runtime.Serialize',
    result: [],
    error: 'Item too large',

    args: [Buffer.alloc(1024 * 1024)],
    gas: FEES[100_000],
  },

  {
    name: 'System.Runtime.Serialize',
    result: [
      new BufferStackItem(
        new BinaryWriter()
          .writeUInt8(StackItemType.Map)
          .writeVarUIntLE(1)
          .writeBytes(
            new BinaryWriter()
              .writeUInt8(StackItemType.ByteArray)
              .writeVarBytesLE(Buffer.from('key', 'utf8'))
              .toBuffer(),
          )
          .writeBytes(
            new BinaryWriter()
              .writeUInt8(StackItemType.ByteArray)
              .writeVarBytesLE(Buffer.from('value', 'utf8'))
              .toBuffer(),
          )
          .toBuffer(),
      ),
    ],

    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'NEWMAP',
            type: 'op',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'SETITEM',
            type: 'op',
            args: [Buffer.from('value', 'utf8'), Buffer.from('key', 'utf8')],
          },
        ],
      },
    ],

    gas: FEES[100_000],
  },

  {
    name: 'System.Runtime.Deserialize',
    result: [new BufferStackItem(Buffer.alloc(10, 1))],
    args: [
      new BinaryWriter()
        .writeUInt8(StackItemType.ByteArray)
        .writeVarBytesLE(Buffer.alloc(10, 1))
        .toBuffer(),
    ],

    gas: FEES[500_000],
  },

  {
    name: 'System.Runtime.Deserialize',
    result: [
      new MapStackItem({
        referenceKeys: new Map([
          [
            new BufferStackItem(Buffer.from('key', 'utf8')).toStructuralKey(),
            new BufferStackItem(Buffer.from('key', 'utf8')),
          ] as const,
        ]),
        referenceValues: new Map([
          [
            new BufferStackItem(Buffer.from('key', 'utf8')).toStructuralKey(),
            new BufferStackItem(Buffer.from('value', 'utf8')),
          ] as const,
        ]),
      }),
    ],

    args: [
      new BinaryWriter()
        .writeUInt8(StackItemType.Map)
        .writeVarUIntLE(1)
        .writeBytes(
          new BinaryWriter()
            .writeUInt8(StackItemType.ByteArray)
            .writeVarBytesLE(Buffer.from('key', 'utf8'))
            .toBuffer(),
        )
        .writeBytes(
          new BinaryWriter()
            .writeUInt8(StackItemType.ByteArray)
            .writeVarBytesLE(Buffer.from('value', 'utf8'))
            .toBuffer(),
        )
        .toBuffer(),
    ],

    gas: FEES[500_000],
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
    name: 'Neo.Json.Serialize',
    result: [new StringStackItem(JSON.stringify(simpleJson))],
    args: [simpleJsonToBuffer],
    gas: FEES[400],
  },

  {
    name: 'Neo.Json.Serialize',
    result: [new StringStackItem(JSON.stringify(nestedJson))],
    args: [nestedJsonToBuffer],
    gas: FEES[400],
  },

  {
    name: 'Neo.Json.Serialize',
    result: [new StringStackItem(JSON.stringify(1))],
    args: [1],
    gas: FEES[400],
  },

  {
    name: 'Neo.Json.Deserialize',
    result: [simpleMapStackItem],
    args: [JSON.stringify(simpleJson)],
    gas: FEES[400],
  },

  {
    name: 'Neo.Json.Deserialize',
    result: [nestedMapStackItem],
    args: [JSON.stringify(nestedJson)],
    gas: FEES[400],
  },

  {
    name: 'Neo.Json.Deserialize',
    result: [new IntegerStackItem(new BN(1))],
    args: ['1'],
    gas: FEES[400],
  },

  {
    name: 'Neo.Crypto.CheckSig',
    result: [new BooleanStackItem(true)],
    args: [keys[0].publicKey, signature0],
    mockTransaction: ({ transaction }) => {
      transaction.messageInternal = jest.fn(() => Buffer.alloc(32, 10));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Crypto.CheckSig',
    result: [new BooleanStackItem(false)],
    args: [keys[0].publicKey, Buffer.alloc(64, 10)],
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Crypto.Verify',
    result: [new BooleanStackItem(true)],
    args: [Buffer.alloc(32, 10), keys[0].publicKey, signature0],
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Crypto.Verify',
    result: [new BooleanStackItem(false)],
    args: [Buffer.alloc(32, 1), keys[0].publicKey, signature0],
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Crypto.CheckMultiSig',
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
    name: 'Neo.Crypto.CheckMultiSig',
    result: [new BooleanStackItem(true)],
    args: [new BN(2), keys[0].publicKey, keys[1].publicKey, new BN(2), signature0, signature1],
    mockTransaction: ({ transaction }) => {
      transaction.messageInternal = jest.fn(() => Buffer.alloc(32, 10));
    },
    gas: FEES[1_000_000].mul(new BN(2)),
  },

  {
    name: 'Neo.Crypto.CheckMultiSig',
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
    name: 'Neo.Crypto.CheckMultiSig',
    result: [new BooleanStackItem(true)],
    args: [new BN(3), keys[0].publicKey, keys[2].publicKey, keys[1].publicKey, new BN(2), signature0, signature1],
    mockTransaction: ({ transaction }) => {
      transaction.messageInternal = jest.fn(() => Buffer.alloc(32, 10));
    },
    gas: FEES[1_000_000].mul(new BN(3)),
  },

  {
    name: 'Neo.Crypto.CheckMultiSig',
    result: [new BooleanStackItem(false)],
    args: [[keys[0].publicKey, keys[1].publicKey], [Buffer.alloc(64, 10)]],
    gas: FEES[1_000_000].mul(new BN(2)),
  },

  {
    name: 'Neo.Crypto.CheckMultiSig',
    result: [new BooleanStackItem(false)],
    args: [new BN(2), keys[0].publicKey, keys[1].publicKey, new BN(1), Buffer.alloc(64, 10)],
    mockTransaction: ({ transaction }) => {
      transaction.messageInternal = jest.fn(() => Buffer.alloc(32, 10));
    },
    gas: FEES[1_000_000].mul(new BN(2)),
  },

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
    result: [new BufferStackItem(Buffer.alloc(0, 0))],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve(undefined));
    },
    args: [scriptAttributeHash],
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Transaction.GetScript',
    result: [new BufferStackItem(transactions.mintTransaction.script)],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Blockchain.GetTransaction',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES[400],
  },

  // {
  //   name: 'Neo.Transaction.GetScript',
  //   result: [],
  //   error: 'Expected InvocationTransaction',
  //   args: [
  //     {
  //       type: 'calls',
  //       calls: [
  //         {
  //           name: 'System.Blockchain.GetTransaction',
  //           type: 'sys',
  //           args: [Buffer.alloc(32, 3)],
  //         },
  //       ],
  //     },
  //   ],

  //   mockBlockchain: ({ blockchain }) => {
  //     blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.claimTransaction));
  //   },
  //   gas: FEES[400],
  // },

  // {
  //   name: 'System.Storage.GetContext',
  //   result: ({ transaction }) => [new StorageContextStackItem(crypto.toScriptHash(transaction.script))],

  //   gas: FEES[400],
  // },

  // {
  //   name: 'System.Storage.GetReadOnlyContext',
  //   result: ({ transaction }) => [new StorageContextStackItem(crypto.toScriptHash(transaction.script), true)],

  //   gas: FEES[400],
  // },

  {
    name: 'System.Storage.Get',
    result: [new BufferStackItem(Buffer.alloc(10, 1))],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(1, 1),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ value: Buffer.alloc(10, 1) }));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Storage.Get',
    result: [new BufferStackItem(Buffer.from([]))],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(1, 1),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve(undefined));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Storage.Find',
    result: () => (result) => {
      expect(result).toMatchSnapshot();
    },
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(1, 1),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of());
    },
    gas: FEES[1_000_000],
  },

  // {
  //   name: 'System.StorageContext.AsReadOnly',
  //   result: ({ transaction }) => (stack) => {
  //     expect(stack.length).toEqual(1);
  //     // It should equal the call's script hash.
  //     expect(stack[0].value).not.toEqual(crypto.toScriptHash(transaction.script));

  //     expect(stack[0].isReadOnly).toBeTruthy();
  //   },
  //   args: [
  //     {
  //       type: 'calls',
  //       calls: [
  //         {
  //           name: 'System.Storage.GetContext',
  //           type: 'sys',
  //         },
  //       ],
  //     },
  //   ],

  //   gas: FEES[400],
  // },

  {
    name: 'Neo.Iterator.Create',
    result: [new IteratorStackItem(new StackItemIterator(testAsyncIterable[Symbol.asyncIterator]()))],
    args: [testArray],
    gas: FEES[400],
  },

  {
    name: 'Neo.Enumerator.Next',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Enumerator.Create',
            type: 'sys',
            args: [[new BN(0)]],
          },
        ],
      },
    ],

    result: [new BooleanStackItem(true)],
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Enumerator.Next',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Iterator.Create',
            type: 'sys',
            args: [
              {
                type: 'calls',
                calls: [
                  {
                    name: 'NEWMAP',
                    type: 'op',
                  },

                  {
                    name: 'DUP',
                    type: 'op',
                  },

                  {
                    name: 'SETITEM',
                    type: 'op',
                    args: [Buffer.from('value', 'utf8'), Buffer.from('key', 'utf8')],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],

    result: [new BooleanStackItem(true)],
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Enumerator.Next',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Enumerator.Create',
            type: 'sys',
            args: [[new BN(0)]],
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'Neo.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },
        ],
      },
    ],

    result: [new BooleanStackItem(false)],
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Enumerator.Value',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Enumerator.Create',
            type: 'sys',
            args: [[new BN(1), new BN(2)]],
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'Neo.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },
        ],
      },
    ],

    result: [new IntegerStackItem(new BN(1))],
    gas: FEES[400],
  },

  {
    name: 'Neo.Enumerator.Next',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Enumerator.Create',
            type: 'sys',
            args: [[new BN(1)]],
          },

          {
            name: 'Neo.Enumerator.Create',
            type: 'sys',
            args: [[new BN(2)]],
          },

          {
            name: 'Neo.Enumerator.Concat',
            type: 'sys',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'Neo.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },

          {
            name: 'Neo.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },
        ],
      },
    ],

    result: [new BooleanStackItem(false)],
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Enumerator.Value',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Enumerator.Create',
            type: 'sys',
            args: [[new BN(2)]],
          },

          {
            name: 'Neo.Enumerator.Create',
            type: 'sys',
            args: [[new BN(1)]],
          },

          {
            name: 'Neo.Enumerator.Concat',
            type: 'sys',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'Neo.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },

          {
            name: 'Neo.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },
        ],
      },
    ],

    result: [new IntegerStackItem(new BN(2))],
    gas: FEES[400],
  },

  {
    name: 'Neo.Enumerator.Value',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Iterator.Create',
            type: 'sys',
            args: [
              {
                type: 'calls',
                calls: [
                  {
                    name: 'NEWMAP',
                    type: 'op',
                  },

                  {
                    name: 'DUP',
                    type: 'op',
                  },

                  {
                    name: 'SETITEM',
                    type: 'op',
                    args: [Buffer.from('value2', 'utf8'), Buffer.from('key2', 'utf8')],
                  },
                ],
              },
            ],
          },

          {
            name: 'Neo.Iterator.Create',
            type: 'sys',
            args: [
              {
                type: 'calls',
                calls: [
                  {
                    name: 'NEWMAP',
                    type: 'op',
                  },

                  {
                    name: 'DUP',
                    type: 'op',
                  },

                  {
                    name: 'SETITEM',
                    type: 'op',
                    args: [Buffer.from('value1', 'utf8'), Buffer.from('key1', 'utf8')],
                  },
                ],
              },
            ],
          },

          {
            name: 'Neo.Iterator.Concat',
            type: 'sys',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'Neo.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },

          {
            name: 'Neo.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },
        ],
      },
    ],

    result: [new BufferStackItem(Buffer.from('value2', 'utf8'))],
    gas: FEES[400],
  },

  {
    name: 'Neo.Iterator.Key',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Iterator.Create',
            type: 'sys',
            args: [
              {
                type: 'calls',
                calls: [
                  {
                    name: 'NEWMAP',
                    type: 'op',
                  },

                  {
                    name: 'DUP',
                    type: 'op',
                  },

                  {
                    name: 'SETITEM',
                    type: 'op',
                    args: [Buffer.from('value2', 'utf8'), Buffer.from('key2', 'utf8')],
                  },
                ],
              },
            ],
          },

          {
            name: 'Neo.Iterator.Create',
            type: 'sys',
            args: [
              {
                type: 'calls',
                calls: [
                  {
                    name: 'NEWMAP',
                    type: 'op',
                  },

                  {
                    name: 'DUP',
                    type: 'op',
                  },

                  {
                    name: 'SETITEM',
                    type: 'op',
                    args: [Buffer.from('value1', 'utf8'), Buffer.from('key1', 'utf8')],
                  },
                ],
              },
            ],
          },

          {
            name: 'Neo.Iterator.Concat',
            type: 'sys',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'Neo.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },

          {
            name: 'Neo.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },
        ],
      },
    ],

    result: [new BufferStackItem(Buffer.from('key2', 'utf8'))],
    gas: FEES[400],
  },

  {
    name: 'Neo.Enumerator.Next',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Storage.Find',
            type: 'sys',
            args: [
              {
                type: 'calls',
                calls: [
                  {
                    name: 'System.Storage.GetContext',
                    type: 'sys',
                  },
                ],
              },

              Buffer.alloc(1, 1),
            ],
          },
        ],
      },
    ],

    result: [new BooleanStackItem(true)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of(Buffer.alloc(1, 1), Buffer.alloc(1, 2)));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Enumerator.Next',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Storage.Find',
            type: 'sys',
            args: [
              {
                type: 'calls',
                calls: [
                  {
                    name: 'System.Storage.GetContext',
                    type: 'sys',
                  },
                ],
              },

              Buffer.alloc(1, 1),
            ],
          },
        ],
      },
    ],

    result: [new BooleanStackItem(false)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of());
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'Neo.Iterator.Key',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'SWAP',
            type: 'op',
            args: [
              {
                type: 'calls',
                calls: [
                  {
                    name: 'Neo.Enumerator.Next',
                    type: 'sys',
                    args: [
                      {
                        type: 'calls',
                        calls: [
                          {
                            name: 'DUP',
                            type: 'op',
                            args: [
                              {
                                type: 'calls',
                                calls: [
                                  {
                                    name: 'Neo.Storage.Find',
                                    type: 'sys',
                                    args: [
                                      {
                                        type: 'calls',
                                        calls: [
                                          {
                                            name: 'System.Storage.GetContext',
                                            type: 'sys',
                                          },
                                        ],
                                      },

                                      Buffer.alloc(1, 1),
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],

    result: [new BufferStackItem(nextItem.key), new BooleanStackItem(true)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of(nextItem));
    },
    gas: FEES[400],
  },

  {
    name: 'Neo.Enumerator.Value',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'SWAP',
            type: 'op',
            args: [
              {
                type: 'calls',
                calls: [
                  {
                    name: 'Neo.Enumerator.Next',
                    type: 'sys',
                    args: [
                      {
                        type: 'calls',
                        calls: [
                          {
                            name: 'DUP',
                            type: 'op',
                            args: [
                              {
                                type: 'calls',
                                calls: [
                                  {
                                    name: 'Neo.Storage.Find',
                                    type: 'sys',
                                    args: [
                                      {
                                        type: 'calls',
                                        calls: [
                                          {
                                            name: 'System.Storage.GetContext',
                                            type: 'sys',
                                          },
                                        ],
                                      },

                                      Buffer.alloc(1, 1),
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],

    result: [new BufferStackItem(nextItem.value), new BooleanStackItem(true)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of(nextItem));
    },
    gas: FEES[400],
  },

  {
    name: 'Neo.Enumerator.Value',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Storage.Find',
            type: 'sys',
            args: [
              {
                type: 'calls',
                calls: [
                  {
                    name: 'System.Storage.GetContext',
                    type: 'sys',
                  },
                ],
              },

              Buffer.alloc(1, 1),
            ],
          },

          {
            name: 'Neo.Iterator.Values',
            type: 'sys',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'Neo.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },
        ],
      },
    ],

    result: [new BufferStackItem(nextItem.value)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of(nextItem));
    },
    gas: FEES[400],
  },

  {
    name: 'Neo.Enumerator.Value',
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Storage.Find',
            type: 'sys',
            args: [
              {
                type: 'calls',
                calls: [
                  {
                    name: 'System.Storage.GetContext',
                    type: 'sys',
                  },
                ],
              },

              Buffer.alloc(1, 1),
            ],
          },

          {
            name: 'Neo.Iterator.Keys',
            type: 'sys',
          },

          {
            name: 'DUP',
            type: 'op',
          },

          {
            name: 'Neo.Enumerator.Next',
            type: 'sys',
          },

          {
            name: 'DROP',
            type: 'op',
          },
        ],
      },
    ],

    result: [new BufferStackItem(nextItem.key)],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of(nextItem));
    },
    gas: FEES[400],
  },

  {
    name: 'Neo.Contract.Update',
    result: [new ContractStackItem(transactions.kycContract)],
    args: [
      transactions.kycContract.script,
      // TODO: fix this test
      // Buffer.from([...transactions.kycContract.parameterList]),
      // transactions.kycContract.returnType,
      // transactions.kycContract.contractProperties,
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.contract.add = jest.fn(async () => Promise.resolve());
      // tslint:disable-next-line: deprecation seems like a bug from rxjs; We don't want the scheduler definition anyway.
      blockchain.storageItem.getAll$ = jest.fn(of);
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: common.FIVE_HUNDRED_FIXED8,
  },

  {
    name: 'System.Contract.Destroy',
    result: [],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Contract.Call',
    result: [],
    args: [
      Buffer.alloc(20, 10),
      Buffer.from('method', 'utf-8'),
      Buffer.from('arguments which need to be checked/changed', 'utf-8'),
    ],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve(undefined));
    },
    gas: FEES[1_000_000],
    error: `Contract Hash Not Found: ${common.uInt160ToString(common.bufferToUInt160(Buffer.alloc(20, 10)))}`,
  },

  {
    name: 'System.Contract.Call',
    result: [],
    args: [
      Buffer.alloc(20, 10),
      Buffer.from('method', 'utf-8'),
      Buffer.from('arguments which need to be checked/changed', 'utf-8'),
    ],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest
        .fn()
        .mockImplementationOnce(async () => Promise.resolve(contractToCall))
        .mockImplementationOnce(async () => Promise.resolve(undefined));
    },
    gas: FEES[1_000_000],
    error: `Contract Hash Not Found: ${common.uInt160ToString(scriptAttributeHash)}`,
  },

  {
    name: 'System.Contract.Call',
    result: [],
    args: [
      Buffer.alloc(20, 10),
      Buffer.from('nonexistent-method', 'utf-8'),
      Buffer.from('arguments which need to be checked/changed', 'utf-8'),
    ],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest
        .fn()
        .mockImplementationOnce(async () => Promise.resolve(contractToCall))
        .mockImplementationOnce(async () => Promise.resolve(callingContract));
    },
    gas: FEES[1_000_000],
    error: `Contract Method Undefined for Contract: ${common.uInt160ToString(
      callingContract.manifest.hash,
    )}. Method: nonexistent-method`,
  },

  {
    name: 'System.Contract.Call',
    result: [],
    args: [
      Buffer.alloc(20, 10),
      Buffer.from('restricted-method', 'utf-8'),
      Buffer.from('arguments which need to be checked/changed', 'utf-8'),
    ],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest
        .fn()
        .mockImplementationOnce(async () => Promise.resolve(contractToCall))
        .mockImplementationOnce(async () => Promise.resolve(callingContract));
    },
    gas: FEES[1_000_000],
    error: `Contract ${common.uInt160ToString(
      callingContract.manifest.hash,
    )} does not have permission to call restricted-method`,
  },

  // TODO: make this one work. make sure all arguments in are appropriate format
  {
    name: 'System.Contract.Call',
    result: [
      Buffer.from('allowed-method', 'utf-8'),
      Buffer.from('arguments which need to be checked/changed', 'utf-8'),
    ],
    args: [
      Buffer.alloc(20, 10),
      Buffer.from('allowed-method', 'utf-8'),
      Buffer.from('arguments which need to be checked/changed', 'utf-8'),
    ],
    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.tryGet = jest
        .fn()
        .mockImplementationOnce(async () => Promise.resolve(contractToCall))
        .mockImplementationOnce(async () => Promise.resolve(callingContract));
    },
    gas: FEES[1_000_000],
  },

  {
    name: 'System.Storage.Put',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(0, 0),
      Buffer.alloc(0, 0),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: utils.ZERO,
  },

  {
    name: 'System.Storage.Put',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(1024, 0),
      Buffer.alloc(0, 0),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: new BN(102400000),
  },

  {
    name: 'System.Storage.Put',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(1025, 0),
      Buffer.alloc(0, 0),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: new BN(102500000),
    error: 'Item too large',
  },

  {
    name: 'System.Storage.Put',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(0, 0),
      Buffer.alloc(1024, 0),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: new BN(102400000),
  },
  {
    name: 'System.Storage.Put',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(0, 0),
      Buffer.alloc(1024, 0),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ hasStorage: true }));
      blockchain.storageItem.update = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: new BN(102400000),
  },

  {
    name: 'System.Storage.Put',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(0, 0),
      Buffer.alloc(1025, 0),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: new BN(102500000),
  },

  {
    name: 'System.Storage.Delete',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'System.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(0, 0),
    ],

    mockBlockchain: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));
      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ flags: StorageFlags.None }));
      blockchain.storageItem.delete = jest.fn(async () => Promise.resolve());
    },
    gas: FEES[1_000_000],
  },

  // {
  //   name: 'System.ExecutionEngine.GetScriptContainer',
  //   result: ({ transaction }) => [new TransactionStackItem(transaction)],
  //   gas: FEES[250],
  // },

  {
    name: 'System.ExecutionEngine.GetScriptContainer',
    flags: new Set(['blockContainer']),
    result: [new BlockStackItem(factory.createBlock({ timestamp: new BN(15) }))],
    gas: FEES[250],
  },

  {
    name: 'System.ExecutionEngine.GetScriptContainer',
    flags: new Set(['consensusContainer']),
    result: [new ConsensusPayloadStackItem(factory.createConsensusPayload({ timestamp: 15 }))],
    gas: FEES[250],
  },

  // {
  //   name: 'System.ExecutionEngine.GetExecutingScriptHash',
  //   result: ({ transaction }) => [new UInt160StackItem(crypto.toScriptHash(transaction.script))],

  //   gas: FEES[400],
  // },

  {
    name: 'System.ExecutionEngine.GetCallingScriptHash',
    result: [new BufferStackItem(Buffer.alloc(0, 0))],
    gas: FEES[400],
  },
  {
    name: 'System.ExecutionEngine.GetCallingScriptHash',
    result: [new UInt160StackItem(common.ZERO_UINT160)],
    gas: FEES[400],
    options: {
      scriptHashStack: [Buffer.alloc(20, 1), common.ZERO_UINT160, Buffer.alloc(20, 2)],
    },
  },

  {
    name: 'System.ExecutionEngine.GetEntryScriptHash',
    result: [new UInt160StackItem(common.ZERO_UINT160)],
    options: {
      scriptHashStack: [Buffer.alloc(20, 1), Buffer.alloc(20, 2), common.ZERO_UINT160],
    },
    gas: FEES[400],
  },
] as readonly TestCase[];

const handleCall = (sb: ScriptBuilder, call: Call) => {
  if (call.args !== undefined) {
    // eslint-disable-next-line
    handleArgs(sb, call.args);
  }
  if (call.type === 'sys') {
    sb.emitSysCall(call.name);
  }
  if (call.type === 'op') {
    sb.emitOp(call.name, call.buffer);
  }
};

const handleArgs = (sb: ScriptBuilder, args: readonly Arg[]) => {
  // tslint:disable-next-line no-loop-statement
  for (let i = args.length - 1; i >= 0; i -= 1) {
    // tslint:disable-next-line no-any
    const arg: any = args[i];
    if (arg != undefined && typeof arg === 'object' && arg.type === 'calls' && arg.calls != undefined) {
      // tslint:disable-next-line no-any
      arg.calls.forEach((call: any) => {
        handleCall(sb, call);
      });
    } else {
      sb.emitPushParam(arg);
    }
  }
};

describe('syscalls', () => {
  // tslint:disable-next-line no-any
  const filterMethods = (value: any): any => {
    if (value == undefined) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(filterMethods);
    }

    if (typeof value === 'function') {
      return undefined;
    }

    if (typeof value === 'object') {
      // tslint:disable-next-line no-any
      const result: { [key: string]: any } = {};
      // tslint:disable-next-line no-loop-statement
      for (const [key, val] of Object.entries(value)) {
        if (key !== 'referenceID' && key !== 'mutableCount') {
          result[key] = filterMethods(val);
        }
      }

      return result;
    }

    return value;
  };

  // tslint:disable-next-line no-loop-statement
  for (const testCase of SYSCALLS) {
    const {
      name,
      result,
      gas,
      args = [],
      mockBlockchain,
      mockTransaction,
      options,
      flags = new Set<flag>(),
      error,
    } = testCase;
    test(name, async () => {
      const sb = new ScriptBuilder();
      sb.emitSysCall(name);
      const transaction = transactions.createTransaction({
        script: sb.build(),
        attributes: [
          new UInt160Attribute({
            usage: AttributeUsage.Script,
            data: scriptAttributeHash,
          }),
        ],
      });

      if (mockTransaction !== undefined) {
        mockTransaction({ transaction });
      }

      const blockchain = {
        contract: {},
        output: {},
        asset: {},
        action: {},
        storageItem: {},
        settings: {},
        currentBlock: {},
        header: {},
        block: {},
        transaction: {},
        account: {},
        validator: {},
        transactionData: {},
      };

      const listeners = {
        onNotify: jest.fn(() => {
          // do nothing
        }),
        onLog: jest.fn(() => {
          // do nothing
        }),
        onMigrateContract: jest.fn(() => {
          // do nothing
        }),
        onSetVotes: jest.fn(() => {
          // do nothing
        }),
      };

      const block = {
        timestamp: blockTime,
      };

      const init: ExecutionInit = {
        scriptContainer: flags.has('blockContainer')
          ? {
              type: ScriptContainerType.Block,
              value: factory.createBlock({ timestamp: new BN(15) }),
            }
          : flags.has('consensusContainer')
          ? {
              type: ScriptContainerType.Consensus,
              value: factory.createConsensusPayload({ timestamp: 15 }),
            }
          : {
              type: ScriptContainerType.Transaction,
              value: flags.has('useBadTransaction') ? transactions.badTransaction : transaction,
            },

        triggerType,
        action: NULL_ACTION,
        listeners,
        skipWitnessVerify: false,
        persistingBlock: flags.has('noPersistingBlock') ? undefined : (block as Block),
      };

      const gasLeft = common.ONE_HUNDRED_MILLION_FIXED8;
      let stack: readonly StackItem[] = [];

      if (mockBlockchain !== undefined) {
        mockBlockchain({ blockchain });
      }

      if (args.length) {
        const argsSB = new ScriptBuilder();
        handleArgs(argsSB, args);

        const argsContext = await executeScript({
          code: argsSB.build(),
          blockchain: blockchain as WriteBlockchain,
          init,
          gasLeft,
        });

        ({ stack } = argsContext);
        expect(argsContext.errorMessage).toBeUndefined();
      }

      const context = await executeScript({
        code: transaction.script,
        blockchain: blockchain as WriteBlockchain,
        init,
        gasLeft,
        options: options === undefined ? { stack } : options,
      });

      if (error !== undefined) {
        expect(context.errorMessage).toBeDefined();
        expect((context.errorMessage as string).startsWith(error)).toBeTruthy();
      } else {
        expect(context.errorMessage).toBeUndefined();

        if (Array.isArray(result)) {
          expect(filterMethods(context.stack)).toEqual(filterMethods(result));
        } else {
          // tslint:disable-next-line no-any
          const expectedResult = (result as any)({ transaction });
          if (Array.isArray(expectedResult)) {
            expect(filterMethods(context.stack)).toEqual(filterMethods(expectedResult));
          } else {
            expectedResult(context.stack);
          }
        }
        expect(gasLeft.sub(context.gasLeft).toString(10)).toEqual(gas.toString(10));

        testUtils.verifyBlockchainSnapshot(blockchain);
        testUtils.verifyListeners(listeners);
      }
    });
  }
});
