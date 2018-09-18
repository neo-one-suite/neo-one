// tslint:disable no-object-mutation
import {
  Account,
  Asset,
  AssetType,
  AttributeUsage,
  BinaryWriter,
  Block,
  common,
  Contract,
  crypto,
  Header,
  InvocationTransaction,
  OpCode,
  Param,
  ScriptBuilder,
  ScriptContainerType,
  StorageItem,
  SysCallName,
  UInt160Attribute,
  utils,
  Validator,
} from '@neo-one/client-core';
import { DefaultMonitor } from '@neo-one/monitor';
import { NULL_ACTION, TriggerType, WriteBlockchain } from '@neo-one/node-core';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import BN from 'bn.js';
import { of } from 'rxjs';
import { keys, testUtils, transactions } from '../__data__';
import { BLOCK_HEIGHT_YEAR, ExecutionInit, FEES, Options } from '../constants';
import { executeScript } from '../execute';
import {
  AccountStackItem,
  ArrayStackItem,
  AssetStackItem,
  AttributeStackItem,
  BlockStackItem,
  BooleanStackItem,
  BufferStackItem,
  ContractStackItem,
  ECPointStackItem,
  HeaderStackItem,
  InputStackItem,
  IntegerStackItem,
  MapStackItem,
  OutputStackItem,
  StackItem,
  StackItemType,
  StorageContextStackItem,
  TransactionStackItem,
  UInt160StackItem,
  UInt256StackItem,
  ValidatorStackItem,
} from '../stackItem';

const monitor = DefaultMonitor.create({
  service: 'test',
});

const triggerType = TriggerType.Application;
const scriptAttributeHash = keys[0].scriptHash;
const blockTime = Date.now();
const blockBase = {
  version: 0,
  previousHash: common.bufferToUInt256(Buffer.alloc(32, 0)),
  merkleRoot: common.bufferToUInt256(Buffer.alloc(32, 1)),
  timestamp: 1,
  index: 2,
  consensusData: new BN(10),
  nextConsensus: keys[1].scriptHash,
  hash: common.bufferToUInt256(Buffer.alloc(32, 2)),
};

const dummyBlock = {
  ...blockBase,
  transactions: [transactions.kycTransaction, transactions.mintTransaction],
};

const ASSETHASH1 = common.uInt256ToHex(common.bufferToUInt256(Buffer.alloc(32, 1)));

const account = {
  version: 0,
  hash: scriptAttributeHash,
  isFrozen: false,
  votes: [keys[0].publicKey, keys[1].publicKey],
  balances: { [ASSETHASH1]: new BN(10) },
};

const asset = {
  hash: common.bufferToUInt256(Buffer.alloc(32, 0)),
  type: AssetType.Currency,
  name: 'assetName',
  amount: new BN(10),
  precision: 8,
  owner: keys[0].publicKey,
  admin: scriptAttributeHash,
  issuer: keys[1].scriptHash,
  expiration: 2,
  available: new BN(5),
};

const nextItem = new StorageItem({
  hash: scriptAttributeHash,
  key: Buffer.from('key', 'utf-8'),
  value: Buffer.from('val', 'utf-8'),
});

interface SysCall {
  readonly name: SysCallName;
  readonly type: 'sys';

  readonly args?: ReadonlyArray<Arg>;
}

interface OpCall {
  readonly name: OpCode;
  readonly type: 'op';

  readonly args?: ReadonlyArray<Arg>;
  readonly buffer?: Buffer;
}
type Call = SysCall | OpCall;

interface Calls {
  readonly type: 'calls';
  readonly calls: ReadonlyArray<Call>;
}
type Arg = Param | undefined | Calls;

interface TestCase {
  readonly name: SysCallName;
  readonly result:
    | ReadonlyArray<StackItem>
    | ((
        options: { readonly transaction: InvocationTransaction },
      ) => // tslint:disable-next-line no-any
      ReadonlyArray<StackItem> | ((result: any) => void));

  readonly gas: BN;
  readonly args?: ReadonlyArray<Arg>;
  readonly options?: Options;
  // tslint:disable-next-line no-any
  readonly mock?: ((options: { readonly blockchain: any }) => void);
}

const SYSCALLS = [
  {
    name: 'Neo.Runtime.GetTrigger',
    result: [new IntegerStackItem(new BN(triggerType))],
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Runtime.CheckWitness',
    result: [new BooleanStackItem(true)],
    args: [scriptAttributeHash],
    gas: FEES.TWO_HUNDRED,
  },

  {
    name: 'Neo.Runtime.CheckWitness',
    result: [new BooleanStackItem(false)],
    args: [keys[1].scriptHash],
    gas: FEES.TWO_HUNDRED,
  },

  {
    name: 'Neo.Runtime.Notify',
    result: [],
    args: [[true]],
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Runtime.Log',
    result: [],
    args: ['foo'],
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Runtime.GetTime',
    result: [new IntegerStackItem(new BN(blockTime))],
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Runtime.Serialize',
    result: [
      new BufferStackItem(
        new BinaryWriter()
          .writeUInt8(StackItemType.ByteArray)
          .writeVarBytesLE(Buffer.alloc(10, 1))
          .toBuffer(),
      ),
    ],

    args: [Buffer.alloc(10, 1)],
    gas: FEES.ONE,
  },

  // This one is a bit odd because true turns into emitting an integer
  // stack item.
  {
    name: 'Neo.Runtime.Serialize',
    result: [
      new BufferStackItem(
        new BinaryWriter()
          .writeUInt8(StackItemType.Integer)
          .writeVarBytesLE(Buffer.alloc(1, 1))
          .toBuffer(),
      ),
    ],

    args: [true],
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Runtime.Serialize',
    result: [
      new BufferStackItem(
        new BinaryWriter()
          .writeUInt8(StackItemType.ByteArray)
          .writeVarBytesLE(utils.toSignedBuffer(new BN('10000000000000', 10)))
          .toBuffer(),
      ),
    ],

    args: [new BN('10000000000000', 10)],
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Runtime.Serialize',
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
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Runtime.Serialize',
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

    gas: FEES.ONE,
  },

  {
    name: 'Neo.Runtime.Deserialize',
    result: [new BufferStackItem(Buffer.alloc(10, 1))],
    args: [
      new BinaryWriter()
        .writeUInt8(StackItemType.ByteArray)
        .writeVarBytesLE(Buffer.alloc(10, 1))
        .toBuffer(),
    ],

    gas: FEES.ONE,
  },

  {
    name: 'Neo.Runtime.Deserialize',
    result: [
      new MapStackItem({
        referenceKeys: new Map([
          [
            new BufferStackItem(Buffer.from('key', 'utf8')).toStructuralKey(),
            new BufferStackItem(Buffer.from('key', 'utf8')),
          ],
        ]),
        referenceValues: new Map([
          [
            new BufferStackItem(Buffer.from('key', 'utf8')).toStructuralKey(),
            new BufferStackItem(Buffer.from('value', 'utf8')),
          ],
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

    gas: FEES.ONE,
  },

  {
    name: 'Neo.Blockchain.GetHeight',
    result: [new IntegerStackItem(new BN(10))],
    mock: ({ blockchain }) => {
      blockchain.currentBlock.index = 10;
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Blockchain.GetHeader',
    result: [new HeaderStackItem(new Header(blockBase))],
    args: [Buffer.alloc(32, 3)],
    mock: ({ blockchain }) => {
      blockchain.header.get = jest.fn(async () => Promise.resolve(new Header(blockBase)));
    },
    gas: FEES.ONE_HUNDRED,
  },

  {
    name: 'Neo.Blockchain.GetBlock',
    result: [new BlockStackItem(new Block(dummyBlock))],
    args: [Buffer.alloc(32, 3)],
    mock: ({ blockchain }) => {
      blockchain.block.get = jest.fn(async () => Promise.resolve(new Block(dummyBlock)));
    },
    gas: FEES.TWO_HUNDRED,
  },

  {
    name: 'Neo.Blockchain.GetTransaction',
    result: [new TransactionStackItem(transactions.mintTransaction)],
    args: [Buffer.alloc(32, 3)],
    mock: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES.ONE_HUNDRED,
  },

  {
    name: 'Neo.Blockchain.GetTransactionHeight',
    result: [new IntegerStackItem(new BN(10))],
    args: [Buffer.alloc(32, 3)],
    mock: ({ blockchain }) => {
      blockchain.transactionData.get = jest.fn(async () => Promise.resolve({ startHeight: 10 }));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Blockchain.GetAccount',
    result: [new AccountStackItem(new Account(account))],
    args: [scriptAttributeHash],
    mock: ({ blockchain }) => {
      blockchain.account.tryGet = jest.fn(async () => Promise.resolve(new Account(account)));
    },
    gas: FEES.ONE_HUNDRED,
  },

  {
    name: 'Neo.Blockchain.GetValidators',
    result: [new ArrayStackItem([new ValidatorStackItem(new Validator({ publicKey: keys[0].publicKey }))])],

    mock: ({ blockchain }) => {
      blockchain.validator.all$ = {
        pipe: () => ({
          toPromise: () => [new ValidatorStackItem(new Validator({ publicKey: keys[0].publicKey }))],
        }),
      };
    },
    gas: FEES.TWO_HUNDRED,
  },

  {
    name: 'Neo.Blockchain.GetAsset',
    result: [new AssetStackItem(new Asset(asset))],
    mock: ({ blockchain }) => {
      blockchain.asset.get = jest.fn(async () => Promise.resolve(new Asset(asset)));
    },
    args: [Buffer.alloc(32, 3)],
    gas: FEES.ONE_HUNDRED,
  },

  {
    name: 'Neo.Blockchain.GetContract',
    result: [new ContractStackItem(transactions.kycContract)],
    mock: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve(transactions.kycContract));
    },
    args: [scriptAttributeHash],
    gas: FEES.ONE_HUNDRED,
  },

  {
    name: 'Neo.Blockchain.GetContract',
    result: [new BufferStackItem(Buffer.alloc(0, 0))],
    mock: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve(undefined));
    },
    args: [scriptAttributeHash],
    gas: FEES.ONE_HUNDRED,
  },

  {
    name: 'Neo.Header.GetHash',
    result: [new UInt256StackItem(blockBase.hash)],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetHeader',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.header.get = jest.fn(async () => Promise.resolve(new Header(blockBase)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Header.GetVersion',
    result: [new IntegerStackItem(new BN(blockBase.version))],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetHeader',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.header.get = jest.fn(async () => Promise.resolve(new Header(blockBase)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Header.GetPrevHash',
    result: [new UInt256StackItem(blockBase.previousHash)],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetHeader',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.header.get = jest.fn(async () => Promise.resolve(new Header(blockBase)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Header.GetIndex',
    result: [new IntegerStackItem(new BN(blockBase.index))],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetHeader',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.header.get = jest.fn(async () => Promise.resolve(new Header(blockBase)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Header.GetMerkleRoot',
    result: [new UInt256StackItem(blockBase.merkleRoot)],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetHeader',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.header.get = jest.fn(async () => Promise.resolve(new Header(blockBase)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Header.GetTimestamp',
    result: [new IntegerStackItem(new BN(blockBase.timestamp))],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetHeader',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.header.get = jest.fn(async () => Promise.resolve(new Header(blockBase)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Header.GetConsensusData',
    result: [new IntegerStackItem(blockBase.consensusData)],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetHeader',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.header.get = jest.fn(async () => Promise.resolve(new Header(blockBase)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Header.GetNextConsensus',
    result: [new UInt160StackItem(blockBase.nextConsensus)],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetHeader',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.header.get = jest.fn(async () => Promise.resolve(new Header(blockBase)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Block.GetTransactionCount',
    result: [new IntegerStackItem(new BN(dummyBlock.transactions.length))],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetBlock',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.block.get = jest.fn(async () => Promise.resolve(new Block(dummyBlock)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Block.GetTransactions',
    result: [
      new ArrayStackItem([
        new TransactionStackItem(transactions.kycTransaction),
        new TransactionStackItem(transactions.mintTransaction),
      ]),
    ],

    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetBlock',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.block.get = jest.fn(async () => Promise.resolve(new Block(dummyBlock)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Block.GetTransaction',
    result: [new TransactionStackItem(transactions.mintTransaction)],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetBlock',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },

      new BN(1),
    ],

    mock: ({ blockchain }) => {
      blockchain.block.get = jest.fn(async () => Promise.resolve(new Block(dummyBlock)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Transaction.GetHash',
    result: [new UInt256StackItem(transactions.mintTransaction.hash)],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetTransaction',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Transaction.GetType',
    result: [new IntegerStackItem(new BN(transactions.mintTransaction.type))],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetTransaction',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Transaction.GetAttributes',
    result: [
      new ArrayStackItem(transactions.mintTransaction.attributes.map((attribute) => new AttributeStackItem(attribute))),
    ],

    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetTransaction',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Transaction.GetInputs',
    result: [new ArrayStackItem(transactions.mintTransaction.inputs.map((input) => new InputStackItem(input)))],

    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetTransaction',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Transaction.GetOutputs',
    result: [new ArrayStackItem(transactions.mintTransaction.outputs.map((output) => new OutputStackItem(output)))],

    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetTransaction',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Transaction.GetReferences',
    result: [new ArrayStackItem([new OutputStackItem(transactions.mintTransaction.outputs[0])])],

    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetTransaction',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));

      blockchain.output.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction.outputs[0]));
    },
    gas: FEES.TWO_HUNDRED,
  },

  {
    name: 'Neo.Transaction.GetUnspentCoins',
    result: [new ArrayStackItem(transactions.mintTransaction.outputs.map((output) => new OutputStackItem(output)))],

    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetTransaction',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));

      blockchain.transactionData.get = jest.fn(async () =>
        Promise.resolve({
          hash: common.bufferToUInt256(Buffer.alloc(32, 0)),
          startHeight: 1,
          endHeights: {},
        }),
      );
    },
    gas: FEES.TWO_HUNDRED,
  },

  {
    name: 'Neo.Transaction.GetUnspentCoins',
    result: [new ArrayStackItem([])],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetTransaction',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));

      blockchain.transactionData.get = jest.fn(async () =>
        Promise.resolve({
          hash: common.bufferToUInt256(Buffer.alloc(32, 0)),
          startHeight: 1,
          endHeights: { '0': 1, '1': 2 },
        }),
      );
    },
    gas: FEES.TWO_HUNDRED,
  },

  {
    name: 'Neo.InvocationTransaction.GetScript',
    result: [new BufferStackItem(transactions.mintTransaction.script)],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetTransaction',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Attribute.GetUsage',
    result: [new IntegerStackItem(new BN(transactions.mintTransaction.attributes[0].usage))],

    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetTransaction',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },

          {
            name: 'Neo.Transaction.GetAttributes',
            type: 'sys',
          },

          {
            name: 'PICKITEM',
            type: 'op',
            args: [new BN(0)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Attribute.GetData',
    result: [new BufferStackItem(transactions.mintTransaction.attributes[0].value)],

    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetTransaction',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },

          {
            name: 'Neo.Transaction.GetAttributes',
            type: 'sys',
          },

          {
            name: 'PICKITEM',
            type: 'op',
            args: [new BN(0)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Input.GetHash',
    result: [new UInt256StackItem(transactions.mintTransaction.inputs[0].hash)],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetTransaction',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },

          {
            name: 'Neo.Transaction.GetInputs',
            type: 'sys',
          },

          {
            name: 'PICKITEM',
            type: 'op',
            args: [new BN(0)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Input.GetIndex',
    result: [new IntegerStackItem(new BN(transactions.mintTransaction.inputs[0].index))],

    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetTransaction',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },

          {
            name: 'Neo.Transaction.GetInputs',
            type: 'sys',
          },

          {
            name: 'PICKITEM',
            type: 'op',
            args: [new BN(0)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Output.GetAssetId',
    result: [new UInt256StackItem(transactions.mintTransaction.outputs[0].asset)],

    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetTransaction',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },

          {
            name: 'Neo.Transaction.GetOutputs',
            type: 'sys',
          },

          {
            name: 'PICKITEM',
            type: 'op',
            args: [new BN(0)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Output.GetValue',
    result: [new IntegerStackItem(transactions.mintTransaction.outputs[0].value)],

    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetTransaction',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },

          {
            name: 'Neo.Transaction.GetOutputs',
            type: 'sys',
          },

          {
            name: 'PICKITEM',
            type: 'op',
            args: [new BN(0)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Output.GetScriptHash',
    result: [new UInt160StackItem(transactions.mintTransaction.outputs[0].address)],

    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetTransaction',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },

          {
            name: 'Neo.Transaction.GetOutputs',
            type: 'sys',
          },

          {
            name: 'PICKITEM',
            type: 'op',
            args: [new BN(0)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(async () => Promise.resolve(transactions.mintTransaction));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Account.GetScriptHash',
    result: [new UInt160StackItem(scriptAttributeHash)],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetAccount',
            type: 'sys',
            args: [scriptAttributeHash],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.account.tryGet = jest.fn(async () => Promise.resolve(new Account(account)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Account.GetVotes',
    result: [new ArrayStackItem(new Account(account).votes.map((vote) => new ECPointStackItem(vote)))],

    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetAccount',
            type: 'sys',
            args: [scriptAttributeHash],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.account.tryGet = jest.fn(async () => Promise.resolve(new Account(account)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Account.GetBalance',
    result: [new IntegerStackItem(account.balances[ASSETHASH1])],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetAccount',
            type: 'sys',
            args: [scriptAttributeHash],
          },
        ],
      },

      common.bufferToUInt256(Buffer.alloc(32, 1)),
    ],

    mock: ({ blockchain }) => {
      blockchain.account.tryGet = jest.fn(async () => Promise.resolve(new Account(account)));

      blockchain.account.get = jest.fn(async () => Promise.resolve(new Account(account)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Account.GetBalance',
    result: [new IntegerStackItem(utils.ZERO)],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetAccount',
            type: 'sys',
            args: [scriptAttributeHash],
          },
        ],
      },

      common.bufferToUInt256(Buffer.alloc(32, 2)),
    ],

    mock: ({ blockchain }) => {
      blockchain.account.tryGet = jest.fn(async () => Promise.resolve(new Account(account)));

      blockchain.account.get = jest.fn(async () => Promise.resolve(new Account(account)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Asset.GetAssetId',
    result: [new UInt256StackItem(asset.hash)],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetAsset',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.asset.get = jest.fn(async () => Promise.resolve(new Asset(asset)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Asset.GetAssetType',
    result: [new IntegerStackItem(new BN(asset.type))],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetAsset',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.asset.get = jest.fn(async () => Promise.resolve(new Asset(asset)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Asset.GetAmount',
    result: [new IntegerStackItem(new BN(asset.amount))],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetAsset',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.asset.get = jest.fn(async () => Promise.resolve(new Asset(asset)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Asset.GetAvailable',
    result: [new IntegerStackItem(new BN(asset.available))],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetAsset',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.asset.get = jest.fn(async () => Promise.resolve(new Asset(asset)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Asset.GetPrecision',
    result: [new IntegerStackItem(new BN(asset.precision))],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetAsset',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.asset.get = jest.fn(async () => Promise.resolve(new Asset(asset)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Asset.GetOwner',
    result: [new ECPointStackItem(asset.owner)],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetAsset',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.asset.get = jest.fn(async () => Promise.resolve(new Asset(asset)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Asset.GetAdmin',
    result: [new UInt160StackItem(asset.admin)],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetAsset',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.asset.get = jest.fn(async () => Promise.resolve(new Asset(asset)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Asset.GetIssuer',
    result: [new UInt160StackItem(asset.issuer)],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetAsset',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.asset.get = jest.fn(async () => Promise.resolve(new Asset(asset)));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Contract.GetScript',
    result: [new BufferStackItem(transactions.kycContract.script)],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetContract',
            type: 'sys',
            args: [scriptAttributeHash],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve(transactions.kycContract));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Contract.IsPayable',
    result: [new BooleanStackItem(transactions.kycContract.payable)],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetContract',
            type: 'sys',
            args: [scriptAttributeHash],
          },
        ],
      },
    ],

    mock: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve(transactions.kycContract));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Storage.GetContext',
    result: ({ transaction }) => [new StorageContextStackItem(crypto.toScriptHash(transaction.script))],

    gas: FEES.ONE,
  },

  {
    name: 'Neo.Storage.GetReadOnlyContext',
    result: ({ transaction }) => [new StorageContextStackItem(crypto.toScriptHash(transaction.script), true)],

    gas: FEES.ONE,
  },

  {
    name: 'Neo.Storage.Get',
    result: [new BufferStackItem(Buffer.alloc(10, 1))],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(1, 1),
    ],

    mock: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve({ value: Buffer.alloc(10, 1) }));
    },
    gas: FEES.ONE_HUNDRED,
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
            name: 'Neo.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(1, 1),
    ],

    mock: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of());
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.StorageContext.AsReadOnly',
    result: ({ transaction }) => (stack) => {
      expect(stack.length).toEqual(1);
      // It should equal the call's script hash.
      expect(stack[0].value).not.toEqual(crypto.toScriptHash(transaction.script));

      expect(stack[0].isReadOnly).toBeTruthy();
    },
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Storage.GetContext',
            type: 'sys',
          },
        ],
      },
    ],

    gas: FEES.ONE,
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
    gas: FEES.ONE,
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
    gas: FEES.ONE,
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
    gas: FEES.ONE,
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
    gas: FEES.ONE,
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
    gas: FEES.ONE,
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
    gas: FEES.ONE,
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
    gas: FEES.ONE,
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
    gas: FEES.ONE,
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
                    name: 'Neo.Storage.GetContext',
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
    mock: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of(Buffer.alloc(1, 1), Buffer.alloc(1, 2)));
    },
    gas: FEES.ONE,
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
                    name: 'Neo.Storage.GetContext',
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
    mock: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of());
    },
    gas: FEES.ONE,
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
                                            name: 'Neo.Storage.GetContext',
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
    mock: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of(nextItem));
    },
    gas: FEES.ONE,
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
                                            name: 'Neo.Storage.GetContext',
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
    mock: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of(nextItem));
    },
    gas: FEES.ONE,
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
                    name: 'Neo.Storage.GetContext',
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
    mock: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of(nextItem));
    },
    gas: FEES.ONE,
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
                    name: 'Neo.Storage.GetContext',
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
    mock: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.getAll$ = jest.fn(() => AsyncIterableX.of(nextItem));
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Account.SetVotes',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetAccount',
            type: 'sys',
            args: [scriptAttributeHash],
          },
        ],
      },

      [keys[2].publicKey],
    ],

    mock: ({ blockchain }) => {
      blockchain.account.tryGet = jest.fn(async () => Promise.resolve(new Account(account)));

      blockchain.account.get = jest.fn(async () => Promise.resolve(new Account(account)));

      blockchain.settings.governingToken = { hashHex: ASSETHASH1 };
      blockchain.account.update = jest.fn(async () =>
        Promise.resolve({
          ...account,
          votes: [keys[2].publicKey],
          isDeletable: () => false,
        }),
      );
    },
    gas: FEES.ONE_THOUSAND,
  },

  {
    name: 'Neo.Validator.Register',
    result: [new ValidatorStackItem(new Validator({ publicKey: keys[0].publicKey }))],

    args: [keys[0].publicKey],
    mock: ({ blockchain }) => {
      blockchain.validator.tryGet = jest.fn(() => new Validator({ publicKey: keys[0].publicKey }));
    },
    gas: common.ONE_THOUSAND_FIXED8,
  },

  {
    name: 'Neo.Asset.Create',
    result: [
      new AssetStackItem(
        new Asset({
          ...asset,
          hash: common.stringToUInt256('0x6859cd3caa26f28d8dd3e2eb29b05019f9dad3c0adf0215a1a4f198f4a9c4e29'),

          available: new BN(0),
        }),
      ),
    ],

    args: [AssetType.Currency, 'assetName', new BN(10), 8, keys[0].publicKey, scriptAttributeHash, keys[1].scriptHash],

    mock: ({ blockchain }) => {
      blockchain.currentBlock.index = 2 - (2000000 + 1);
      blockchain.asset.add = jest.fn(async () => Promise.resolve());
    },
    gas: common.FIVE_THOUSAND_FIXED8,
  },

  {
    name: 'Neo.Asset.Renew',
    result: [new IntegerStackItem(new BN(2).add(new BN(2).mul(new BN(BLOCK_HEIGHT_YEAR))))],

    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Blockchain.GetAsset',
            type: 'sys',
            args: [Buffer.alloc(32, 3)],
          },
        ],
      },

      new BN(2),
    ],

    mock: ({ blockchain }) => {
      blockchain.asset.get = jest.fn(async () => Promise.resolve(new Asset(asset)));
      blockchain.currentBlock.index = 1;
      blockchain.asset.update = jest.fn(async () => Promise.resolve());
    },
    gas: common.FIVE_THOUSAND_FIXED8.mul(new BN(2)),
  },

  {
    name: 'Neo.Contract.Create',
    result: [new ContractStackItem(transactions.kycContract)],
    args: [
      transactions.kycContract.script,
      Buffer.from([...transactions.kycContract.parameterList]),
      transactions.kycContract.returnType,
      transactions.kycContract.contractProperties,
      transactions.kycContract.name,
      transactions.kycContract.codeVersion,
      transactions.kycContract.author,
      transactions.kycContract.email,
      transactions.kycContract.description,
    ],

    mock: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.contract.add = jest.fn(async () => Promise.resolve());
    },
    gas: common.FIVE_HUNDRED_FIXED8,
  },

  {
    name: 'Neo.Contract.Migrate',
    result: [new ContractStackItem(transactions.kycContract)],
    args: [
      transactions.kycContract.script,
      Buffer.from([...transactions.kycContract.parameterList]),
      transactions.kycContract.returnType,
      transactions.kycContract.contractProperties,
      transactions.kycContract.name,
      transactions.kycContract.codeVersion,
      transactions.kycContract.author,
      transactions.kycContract.email,
      transactions.kycContract.description,
    ],

    mock: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.contract.add = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.getAll$ = jest.fn(of);
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: common.FIVE_HUNDRED_FIXED8,
  },

  {
    name: 'Neo.Contract.GetStorageContext',
    options: {
      stack: [new ContractStackItem(new Contract(transactions.kycContract))],
      createdContracts: {
        [transactions.kycContract.hashHex]: Buffer.from('f42c9189cbfc9d582b7039b29e2cf36ec1283f1b', 'hex'),
      },
    },
    result: [new StorageContextStackItem(transactions.kycContract.hash)],
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Contract.Destroy',
    result: [],
    mock: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(async () => Promise.resolve());
    },
    gas: FEES.ONE,
  },

  {
    name: 'Neo.Storage.Put',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(0, 0),
      Buffer.alloc(0, 0),
    ],

    mock: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: FEES.ONE_THOUSAND,
  },

  {
    name: 'Neo.Storage.Put',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(1024, 0),
      Buffer.alloc(0, 0),
    ],

    mock: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: FEES.ONE_THOUSAND,
  },

  {
    name: 'Neo.Storage.Put',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(1025, 0),
      Buffer.alloc(0, 0),
    ],

    mock: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: FEES.ONE_THOUSAND.mul(new BN(2)),
  },

  {
    name: 'Neo.Storage.Put',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(0, 0),
      Buffer.alloc(1024, 0),
    ],

    mock: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: FEES.ONE_THOUSAND,
  },

  {
    name: 'Neo.Storage.Put',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(0, 0),
      Buffer.alloc(1025, 0),
    ],

    mock: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.tryGet = jest.fn(async () => Promise.resolve());
      blockchain.storageItem.add = jest.fn(async () => Promise.resolve());
    },
    gas: FEES.ONE_THOUSAND.mul(new BN(2)),
  },

  {
    name: 'Neo.Storage.Delete',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [
          {
            name: 'Neo.Storage.GetContext',
            type: 'sys',
          },
        ],
      },

      Buffer.alloc(0, 0),
    ],

    mock: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(async () => Promise.resolve({ hasStorage: true }));

      blockchain.storageItem.delete = jest.fn(async () => Promise.resolve());
    },
    gas: FEES.ONE_HUNDRED,
  },

  {
    name: 'System.ExecutionEngine.GetScriptContainer',
    result: ({ transaction }) => [new TransactionStackItem(transaction)],
    gas: FEES.ONE,
  },

  {
    name: 'System.ExecutionEngine.GetExecutingScriptHash',
    result: ({ transaction }) => [new UInt160StackItem(crypto.toScriptHash(transaction.script))],

    gas: FEES.ONE,
  },

  {
    name: 'System.ExecutionEngine.GetCallingScriptHash',
    result: [new BufferStackItem(Buffer.alloc(0, 0))],
    gas: FEES.ONE,
  },

  {
    name: 'System.ExecutionEngine.GetEntryScriptHash',
    result: ({ transaction }) => [new UInt160StackItem(crypto.toScriptHash(transaction.script))],

    gas: FEES.ONE,
  },
] as ReadonlyArray<TestCase>;

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

const handleArgs = (sb: ScriptBuilder, args: ReadonlyArray<Arg>) => {
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
        if (key !== 'referenceID') {
          result[key] = filterMethods(val);
        }
      }

      return result;
    }

    return value;
  };

  // tslint:disable-next-line no-loop-statement
  for (const testCase of SYSCALLS) {
    const { name, result, gas, args = [], mock, options } = testCase;
    it(name, async () => {
      const sb = new ScriptBuilder();
      sb.emitSysCall(name);
      const transaction = transactions.createInvocation({
        script: sb.build(),
        attributes: [
          new UInt160Attribute({
            usage: AttributeUsage.Script,
            value: scriptAttributeHash,
          }),
        ],
      });

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
        scriptContainer: {
          type: ScriptContainerType.Transaction,
          value: transaction,
        },

        triggerType,
        action: NULL_ACTION,
        listeners,
        skipWitnessVerify: false,
        persistingBlock: block as Block,
      };

      const gasLeft = common.ONE_HUNDRED_MILLION_FIXED8;
      let stack: ReadonlyArray<StackItem> = [];

      if (mock !== undefined) {
        mock({ blockchain });
      }

      if (args.length) {
        const argsSB = new ScriptBuilder();
        handleArgs(argsSB, args);

        const argsContext = await executeScript({
          monitor,
          code: argsSB.build(),
          blockchain: blockchain as WriteBlockchain,
          init,
          gasLeft,
        });

        ({ stack } = argsContext);
        expect(argsContext.errorMessage).toBeUndefined();
      }

      const context = await executeScript({
        monitor,
        code: transaction.script,
        blockchain: blockchain as WriteBlockchain,
        init,
        gasLeft,
        options: options === undefined ? { stack } : options,
      });

      expect(context.errorMessage).toBeUndefined();
      if (Array.isArray(result)) {
        expect(filterMethods(context.stack)).toEqual(filterMethods(result));
      } else {
        // tslint:disable-next-line no-any
        const expectedResult = (result as any)({ transaction });
        if (Array.isArray(expectedResult)) {
          expect(context.stack).toEqual(expectedResult);
        } else {
          expectedResult(context.stack);
        }
      }
      expect(gasLeft.sub(context.gasLeft).toString(10)).toEqual(gas.toString(10));

      testUtils.verifyBlockchainSnapshot(blockchain);
      testUtils.verifyListeners(listeners);
    });
  }
});
