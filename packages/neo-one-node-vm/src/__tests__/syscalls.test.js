/* @flow */
/* eslint-disable no-param-reassign */
import { NULL_ACTION, TRIGGER_TYPE } from '@neo-one/node-core';
import {
  type Param,
  type OpCode,
  type SysCallName,
  ATTRIBUTE_USAGE,
  SCRIPT_CONTAINER_TYPE,
  BinaryWriter,
  InvocationTransaction,
  UInt160Attribute,
  ScriptBuilder,
  common,
  crypto,
  Header,
  Block,
  Account,
  Validator,
  Asset,
  ASSET_TYPE,
  utils,
  Contract,
  StorageItem,
} from '@neo-one/client-core';
import BN from 'bn.js';
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';
import { DefaultMonitor } from '@neo-one/monitor';
import { of } from 'rxjs/observable/of';

import { utils as commonUtils } from '@neo-one/utils';

import { FEES, BLOCK_HEIGHT_YEAR, type Options } from '../constants';
import {
  STACK_ITEM_TYPE,
  type StackItem,
  BufferStackItem,
  BooleanStackItem,
  IntegerStackItem,
  StorageContextStackItem,
  TransactionStackItem,
  UInt160StackItem,
  HeaderStackItem,
  BlockStackItem,
  AccountStackItem,
  ArrayStackItem,
  ValidatorStackItem,
  AssetStackItem,
  ContractStackItem,
  UInt256StackItem,
  AttributeStackItem,
  InputStackItem,
  OutputStackItem,
  ECPointStackItem,
} from '../stackItem';

import { executeScript } from '../execute';
import { keys, testUtils, transactions } from '../__data__';

const monitor = DefaultMonitor.create({
  service: 'test',
});

const triggerType = TRIGGER_TYPE.APPLICATION;
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
const ASSETHASH1 = common.uInt256ToHex(
  common.bufferToUInt256(Buffer.alloc(32, 1)),
);

const account = {
  version: 0,
  hash: scriptAttributeHash,
  isFrozen: false,
  votes: [keys[0].publicKey, keys[1].publicKey],
  balances: { [(ASSETHASH1: $FlowFixMe)]: new BN(10) },
};
const asset = {
  hash: common.bufferToUInt256(Buffer.alloc(32, 0)),
  type: ASSET_TYPE.CURRENCY,
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

type SysCall = {|
  name: SysCallName,
  type: 'sys',
  // eslint-disable-next-line
  args?: Array<Arg>,
|};
type OpCall = {|
  name: OpCode,
  type: 'op',
  // eslint-disable-next-line
  args?: Array<Arg>,
  buffer?: Buffer,
|};
type Call = SysCall | OpCall;
type Calls = {|
  type: 'calls',
  calls: Array<Call>,
|};
type Arg = ?Param | Calls;
type TestCase = {|
  name: SysCallName,
  result:
    | Array<StackItem>
    | ((options: {| transaction: InvocationTransaction |}) =>
        | Array<StackItem>
        | ((result: any) => void)),
  gas: BN,
  args?: Array<Arg>,
  actionIndex?: number,
  options?: Options,
  mock?: (options: {| blockchain: any |}) => void,
|};

const SYSCALLS = ([
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
    mock: ({ blockchain }) => {
      blockchain.action.add = jest.fn(() => Promise.resolve());
    },
    gas: FEES.ONE,
    actionIndex: 1,
  },
  {
    name: 'Neo.Runtime.Log',
    result: [],
    args: ['foo'],
    mock: ({ blockchain }) => {
      blockchain.action.add = jest.fn(() => Promise.resolve());
    },
    gas: FEES.ONE,
    actionIndex: 1,
  },
  {
    name: 'Neo.Runtime.GetTime',
    result: [new IntegerStackItem(new BN(blockTime))],
    gas: FEES.ONE,
  },
  // TODO (afragapane): Reverse of each of these + STRUCT + error cases
  {
    name: 'Neo.Runtime.Serialize',
    result: [
      new BufferStackItem(
        new BinaryWriter()
          .writeUInt8(STACK_ITEM_TYPE.BYTE_ARRAY)
          .writeVarBytesLE(Buffer.alloc(10, 1))
          .toBuffer(),
      ),
    ],
    args: [Buffer.alloc(10, 1)],
    gas: FEES.ONE,
  },
  // TODO (afragapane): What's going on with this one?
  // {
  //   name: 'Neo.Runtime.Serialize',
  //   result: [
  //     new BufferStackItem(
  //       new BinaryWriter()
  //         .writeUInt8(STACK_ITEM_TYPE.BYTE_ARRAY)
  //         .writeVarBytesLE(Buffer.alloc(1, 1))
  //         .toBuffer(),
  //     ),
  //   ],
  //   args: [true],
  //   gas: FEES.ONE,
  // },
  {
    name: 'Neo.Runtime.Serialize',
    result: [
      new BufferStackItem(
        new BinaryWriter()
          .writeUInt8(STACK_ITEM_TYPE.BYTE_ARRAY)
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
          .writeUInt8(STACK_ITEM_TYPE.ARRAY)
          .writeVarUIntLE(1)
          .writeBytes(
            new BinaryWriter()
              .writeUInt8(STACK_ITEM_TYPE.BYTE_ARRAY)
              .writeVarBytesLE(
                utils.toSignedBuffer(new BN('10000000000000', 10)),
              )
              .toBuffer(),
          )
          .toBuffer(),
      ),
    ],
    args: [[new BN('10000000000000', 10)]],
    gas: FEES.ONE,
  },
  {
    name: 'Neo.Runtime.Deserialize',
    result: [new BufferStackItem(Buffer.alloc(10, 1))],
    args: [
      new BinaryWriter()
        .writeUInt8(STACK_ITEM_TYPE.BYTE_ARRAY)
        .writeVarBytesLE(Buffer.alloc(10, 1))
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
      blockchain.header.get = jest.fn(() =>
        Promise.resolve(new Header(blockBase)),
      );
    },
    gas: FEES.ONE_HUNDRED,
  },
  {
    name: 'Neo.Blockchain.GetBlock',
    result: [new BlockStackItem(new Block(dummyBlock))],
    args: [Buffer.alloc(32, 3)],
    mock: ({ blockchain }) => {
      blockchain.block.get = jest.fn(() =>
        Promise.resolve(new Block(dummyBlock)),
      );
    },
    gas: FEES.TWO_HUNDRED,
  },
  {
    name: 'Neo.Blockchain.GetTransaction',
    result: [new TransactionStackItem(transactions.mintTransaction)],
    args: [Buffer.alloc(32, 3)],
    mock: ({ blockchain }) => {
      blockchain.transaction.get = jest.fn(() =>
        Promise.resolve(transactions.mintTransaction),
      );
    },
    gas: FEES.ONE_HUNDRED,
  },
  {
    name: 'Neo.Blockchain.GetAccount',
    result: [new AccountStackItem(new Account(account))],
    args: [scriptAttributeHash],
    mock: ({ blockchain }) => {
      blockchain.account.tryGet = jest.fn(() =>
        Promise.resolve(new Account(account)),
      );
    },
    gas: FEES.ONE_HUNDRED,
  },
  {
    name: 'Neo.Blockchain.GetValidators',
    result: [
      new ArrayStackItem([
        new ValidatorStackItem(new Validator({ publicKey: keys[0].publicKey })),
      ]),
    ],
    mock: ({ blockchain }) => {
      blockchain.validator.all = {
        pipe: () => ({
          toPromise: () => [
            new ValidatorStackItem(
              new Validator({ publicKey: keys[0].publicKey }),
            ),
          ],
        }),
      };
    },
    gas: FEES.TWO_HUNDRED,
  },
  {
    name: 'Neo.Blockchain.GetAsset',
    result: [new AssetStackItem(new Asset(asset))],
    mock: ({ blockchain }) => {
      blockchain.asset.get = jest.fn(() => Promise.resolve(new Asset(asset)));
    },
    args: [Buffer.alloc(32, 3)],
    gas: FEES.ONE_HUNDRED,
  },
  {
    name: 'Neo.Blockchain.GetContract',
    result: [new ContractStackItem(transactions.kycContract)],
    mock: ({ blockchain }) => {
      blockchain.contract.get = jest.fn(() =>
        Promise.resolve(transactions.kycContract),
      );
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
      blockchain.header.get = jest.fn(() =>
        Promise.resolve(new Header(blockBase)),
      );
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
      blockchain.header.get = jest.fn(() =>
        Promise.resolve(new Header(blockBase)),
      );
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
      blockchain.header.get = jest.fn(() =>
        Promise.resolve(new Header(blockBase)),
      );
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
      blockchain.header.get = jest.fn(() =>
        Promise.resolve(new Header(blockBase)),
      );
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
      blockchain.header.get = jest.fn(() =>
        Promise.resolve(new Header(blockBase)),
      );
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
      blockchain.header.get = jest.fn(() =>
        Promise.resolve(new Header(blockBase)),
      );
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
      blockchain.header.get = jest.fn(() =>
        Promise.resolve(new Header(blockBase)),
      );
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
      blockchain.header.get = jest.fn(() =>
        Promise.resolve(new Header(blockBase)),
      );
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
      blockchain.block.get = jest.fn(() =>
        Promise.resolve(new Block(dummyBlock)),
      );
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
      blockchain.block.get = jest.fn(() =>
        Promise.resolve(new Block(dummyBlock)),
      );
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
      blockchain.block.get = jest.fn(() =>
        Promise.resolve(new Block(dummyBlock)),
      );
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
      blockchain.transaction.get = jest.fn(() =>
        Promise.resolve(transactions.mintTransaction),
      );
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
      blockchain.transaction.get = jest.fn(() =>
        Promise.resolve(transactions.mintTransaction),
      );
    },
    gas: FEES.ONE,
  },
  {
    name: 'Neo.Transaction.GetAttributes',
    result: [
      new ArrayStackItem(
        transactions.mintTransaction.attributes.map(
          attribute => new AttributeStackItem(attribute),
        ),
      ),
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
      blockchain.transaction.get = jest.fn(() =>
        Promise.resolve(transactions.mintTransaction),
      );
    },
    gas: FEES.ONE,
  },
  {
    name: 'Neo.Transaction.GetInputs',
    result: [
      new ArrayStackItem(
        transactions.mintTransaction.inputs.map(
          input => new InputStackItem(input),
        ),
      ),
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
      blockchain.transaction.get = jest.fn(() =>
        Promise.resolve(transactions.mintTransaction),
      );
    },
    gas: FEES.ONE,
  },
  {
    name: 'Neo.Transaction.GetOutputs',
    result: [
      new ArrayStackItem(
        transactions.mintTransaction.outputs.map(
          output => new OutputStackItem(output),
        ),
      ),
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
      blockchain.transaction.get = jest.fn(() =>
        Promise.resolve(transactions.mintTransaction),
      );
    },
    gas: FEES.ONE,
  },
  {
    name: 'Neo.Transaction.GetReferences',
    result: [
      new ArrayStackItem([
        new OutputStackItem(transactions.mintTransaction.outputs[0]),
      ]),
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
      blockchain.transaction.get = jest.fn(() =>
        Promise.resolve(transactions.mintTransaction),
      );
      blockchain.output.get = jest.fn(() =>
        Promise.resolve(transactions.mintTransaction.outputs[0]),
      );
    },
    gas: FEES.TWO_HUNDRED,
  },
  {
    name: 'Neo.Transaction.GetUnspentCoins',
    result: [
      new ArrayStackItem(
        transactions.mintTransaction.outputs.map(
          output => new OutputStackItem(output),
        ),
      ),
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
      blockchain.transaction.get = jest.fn(() =>
        Promise.resolve(transactions.mintTransaction),
      );
      blockchain.transactionSpentCoins.get = jest.fn(() =>
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
      blockchain.transaction.get = jest.fn(() =>
        Promise.resolve(transactions.mintTransaction),
      );
      blockchain.transactionSpentCoins.get = jest.fn(() =>
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
      blockchain.transaction.get = jest.fn(() =>
        Promise.resolve(transactions.mintTransaction),
      );
    },
    gas: FEES.ONE,
  },
  {
    name: 'Neo.Attribute.GetUsage',
    result: [
      new IntegerStackItem(
        new BN(transactions.mintTransaction.attributes[0].usage),
      ),
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
      blockchain.transaction.get = jest.fn(() =>
        Promise.resolve(transactions.mintTransaction),
      );
    },
    gas: FEES.ONE,
  },
  {
    name: 'Neo.Attribute.GetData',
    result: [
      new BufferStackItem(transactions.mintTransaction.attributes[0].value),
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
      blockchain.transaction.get = jest.fn(() =>
        Promise.resolve(transactions.mintTransaction),
      );
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
      blockchain.transaction.get = jest.fn(() =>
        Promise.resolve(transactions.mintTransaction),
      );
    },
    gas: FEES.ONE,
  },
  {
    name: 'Neo.Input.GetIndex',
    result: [
      new IntegerStackItem(
        new BN(transactions.mintTransaction.inputs[0].index),
      ),
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
      blockchain.transaction.get = jest.fn(() =>
        Promise.resolve(transactions.mintTransaction),
      );
    },
    gas: FEES.ONE,
  },
  {
    name: 'Neo.Output.GetAssetId',
    result: [
      new UInt256StackItem(transactions.mintTransaction.outputs[0].asset),
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
      blockchain.transaction.get = jest.fn(() =>
        Promise.resolve(transactions.mintTransaction),
      );
    },
    gas: FEES.ONE,
  },
  {
    name: 'Neo.Output.GetValue',
    result: [
      new IntegerStackItem(transactions.mintTransaction.outputs[0].value),
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
      blockchain.transaction.get = jest.fn(() =>
        Promise.resolve(transactions.mintTransaction),
      );
    },
    gas: FEES.ONE,
  },
  {
    name: 'Neo.Output.GetScriptHash',
    result: [
      new UInt160StackItem(transactions.mintTransaction.outputs[0].address),
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
      blockchain.transaction.get = jest.fn(() =>
        Promise.resolve(transactions.mintTransaction),
      );
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
      blockchain.account.tryGet = jest.fn(() =>
        Promise.resolve(new Account(account)),
      );
    },
    gas: FEES.ONE,
  },
  {
    name: 'Neo.Account.GetVotes',
    result: [
      new ArrayStackItem(
        new Account(account).votes.map(vote => new ECPointStackItem(vote)),
      ),
    ],
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
      blockchain.account.tryGet = jest.fn(() =>
        Promise.resolve(new Account(account)),
      );
    },
    gas: FEES.ONE,
  },
  {
    name: 'Neo.Account.GetBalance',
    result: [new IntegerStackItem(account.balances[(ASSETHASH1: $FlowFixMe)])],
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
      blockchain.account.tryGet = jest.fn(() =>
        Promise.resolve(new Account(account)),
      );
      blockchain.account.get = jest.fn(() =>
        Promise.resolve(new Account(account)),
      );
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
      blockchain.account.tryGet = jest.fn(() =>
        Promise.resolve(new Account(account)),
      );
      blockchain.account.get = jest.fn(() =>
        Promise.resolve(new Account(account)),
      );
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
      blockchain.asset.get = jest.fn(() => Promise.resolve(new Asset(asset)));
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
      blockchain.asset.get = jest.fn(() => Promise.resolve(new Asset(asset)));
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
      blockchain.asset.get = jest.fn(() => Promise.resolve(new Asset(asset)));
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
      blockchain.asset.get = jest.fn(() => Promise.resolve(new Asset(asset)));
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
      blockchain.asset.get = jest.fn(() => Promise.resolve(new Asset(asset)));
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
      blockchain.asset.get = jest.fn(() => Promise.resolve(new Asset(asset)));
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
      blockchain.asset.get = jest.fn(() => Promise.resolve(new Asset(asset)));
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
      blockchain.asset.get = jest.fn(() => Promise.resolve(new Asset(asset)));
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
      blockchain.contract.get = jest.fn(() =>
        Promise.resolve(transactions.kycContract),
      );
    },
    gas: FEES.ONE,
  },
  {
    name: 'Neo.Storage.GetContext',
    result: ({ transaction }) => [
      new StorageContextStackItem(crypto.toScriptHash(transaction.script)),
    ],
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
      blockchain.contract.get = jest.fn(() =>
        Promise.resolve({ hasStorage: true }),
      );
      blockchain.storageItem.tryGet = jest.fn(() =>
        Promise.resolve({ value: Buffer.alloc(10, 1) }),
      );
    },
    gas: FEES.ONE_HUNDRED,
  },
  {
    name: 'Neo.Storage.Find',
    result: () => result => {
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
      blockchain.contract.get = jest.fn(() =>
        Promise.resolve({ hasStorage: true }),
      );
      blockchain.storageItem.getAll = jest.fn(() => AsyncIterableX.of([]));
    },
    gas: FEES.ONE,
  },
  {
    name: 'Neo.Iterator.Next',
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
      blockchain.contract.get = jest.fn(() =>
        Promise.resolve({ hasStorage: true }),
      );
      blockchain.storageItem.getAll = jest.fn(() =>
        AsyncIterableX.of(Buffer.alloc(1, 1), Buffer.alloc(1, 2)),
      );
    },
    gas: FEES.ONE,
  },
  {
    name: 'Neo.Iterator.Next',
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
      blockchain.contract.get = jest.fn(() =>
        Promise.resolve({ hasStorage: true }),
      );
      blockchain.storageItem.getAll = jest.fn(() => AsyncIterableX.of());
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
                    name: 'Neo.Iterator.Next',
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
      blockchain.contract.get = jest.fn(() =>
        Promise.resolve({ hasStorage: true }),
      );
      blockchain.storageItem.getAll = jest.fn(() =>
        AsyncIterableX.of(nextItem),
      );
    },
    gas: FEES.ONE,
  },
  {
    name: 'Neo.Iterator.Value',
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
                    name: 'Neo.Iterator.Next',
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
      blockchain.contract.get = jest.fn(() =>
        Promise.resolve({ hasStorage: true }),
      );
      blockchain.storageItem.getAll = jest.fn(() =>
        AsyncIterableX.of(nextItem),
      );
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
      blockchain.account.tryGet = jest.fn(() =>
        Promise.resolve(new Account(account)),
      );
      blockchain.account.get = jest.fn(() =>
        Promise.resolve(new Account(account)),
      );
      blockchain.settings.governingToken = { hashHex: ASSETHASH1 };
      blockchain.account.update = jest.fn(() =>
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
    result: [
      new ValidatorStackItem(new Validator({ publicKey: keys[0].publicKey })),
    ],
    args: [keys[0].publicKey],
    mock: ({ blockchain }) => {
      blockchain.validator.tryGet = jest.fn(
        () => new Validator({ publicKey: keys[0].publicKey }),
      );
    },
    gas: common.ONE_THOUSAND_FIXED8,
  },
  {
    name: 'Neo.Asset.Create',
    result: [
      new AssetStackItem(
        new Asset({
          ...asset,
          hash: common.stringToUInt256(
            '0x6859cd3caa26f28d8dd3e2eb29b05019f9dad3c0adf0215a1a4f198f4a9c4e29',
          ),
          available: new BN(0),
        }),
      ),
    ],
    args: [
      ASSET_TYPE.CURRENCY,
      'assetName',
      new BN(10),
      8,
      keys[0].publicKey,
      scriptAttributeHash,
      keys[1].scriptHash,
    ],
    mock: ({ blockchain }) => {
      blockchain.currentBlock.index = 2 - (2000000 + 1);
      blockchain.asset.add = jest.fn(() => Promise.resolve());
    },
    gas: common.FIVE_THOUSAND_FIXED8,
  },
  {
    name: 'Neo.Asset.Renew',
    result: [
      new IntegerStackItem(
        new BN(2).add(new BN(2).mul(new BN(BLOCK_HEIGHT_YEAR))),
      ),
    ],
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
      blockchain.asset.get = jest.fn(() => Promise.resolve(new Asset(asset)));
      blockchain.currentBlock.index = 1;
      blockchain.asset.update = jest.fn(() => Promise.resolve());
    },
    gas: common.FIVE_THOUSAND_FIXED8.mul(new BN(2)),
  },
  {
    name: 'Neo.Contract.Create',
    result: [new ContractStackItem(transactions.kycContract)],
    args: [
      transactions.kycContract.script,
      Buffer.from(transactions.kycContract.parameterList),
      transactions.kycContract.returnType,
      transactions.kycContract.contractProperties,
      transactions.kycContract.name,
      transactions.kycContract.codeVersion,
      transactions.kycContract.author,
      transactions.kycContract.email,
      transactions.kycContract.description,
    ],
    mock: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(() => Promise.resolve());
      blockchain.contract.add = jest.fn(() => Promise.resolve());
    },
    gas: common.FIVE_HUNDRED_FIXED8,
  },
  {
    name: 'Neo.Contract.Migrate',
    result: [new ContractStackItem(transactions.kycContract)],
    args: [
      transactions.kycContract.script,
      Buffer.from(transactions.kycContract.parameterList),
      transactions.kycContract.returnType,
      transactions.kycContract.contractProperties,
      transactions.kycContract.name,
      transactions.kycContract.codeVersion,
      transactions.kycContract.author,
      transactions.kycContract.email,
      transactions.kycContract.description,
    ],
    mock: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(() => Promise.resolve());
      blockchain.contract.add = jest.fn(() => Promise.resolve());
      blockchain.storageItem.getAll = jest.fn(() => of());
    },
    gas: common.FIVE_HUNDRED_FIXED8,
  },
  {
    name: 'Neo.Contract.GetStorageContext',
    options: ({
      stack: [new ContractStackItem(new Contract(transactions.kycContract))],
      createdContracts: {
        [transactions.kycContract.hashHex]: Buffer.from(
          'f42c9189cbfc9d582b7039b29e2cf36ec1283f1b',
          'hex',
        ),
      },
    }: $FlowFixMe),
    result: [new StorageContextStackItem(transactions.kycContract.hash)],
    gas: FEES.ONE,
  },
  {
    name: 'Neo.Contract.Destroy',
    result: [],
    mock: ({ blockchain }) => {
      blockchain.contract.tryGet = jest.fn(() => {
        Promise.resolve();
      });
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
      blockchain.contract.get = jest.fn(() =>
        Promise.resolve({ hasStorage: true }),
      );
      blockchain.storageItem.tryGet = jest.fn(() => Promise.resolve());
      blockchain.storageItem.add = jest.fn(() => Promise.resolve());
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
      blockchain.contract.get = jest.fn(() =>
        Promise.resolve({ hasStorage: true }),
      );
      blockchain.storageItem.tryGet = jest.fn(() => Promise.resolve());
      blockchain.storageItem.add = jest.fn(() => Promise.resolve());
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
      blockchain.contract.get = jest.fn(() =>
        Promise.resolve({ hasStorage: true }),
      );
      blockchain.storageItem.tryGet = jest.fn(() => Promise.resolve());
      blockchain.storageItem.add = jest.fn(() => Promise.resolve());
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
      blockchain.contract.get = jest.fn(() =>
        Promise.resolve({ hasStorage: true }),
      );
      blockchain.storageItem.tryGet = jest.fn(() => Promise.resolve());
      blockchain.storageItem.add = jest.fn(() => Promise.resolve());
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
      blockchain.contract.get = jest.fn(() =>
        Promise.resolve({ hasStorage: true }),
      );
      blockchain.storageItem.tryGet = jest.fn(() => Promise.resolve());
      blockchain.storageItem.add = jest.fn(() => Promise.resolve());
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
      blockchain.contract.get = jest.fn(() =>
        Promise.resolve({ hasStorage: true }),
      );
      blockchain.storageItem.delete = jest.fn(() => Promise.resolve());
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
    result: ({ transaction }) => [
      new UInt160StackItem(crypto.toScriptHash(transaction.script)),
    ],
    gas: FEES.ONE,
  },
  {
    name: 'System.ExecutionEngine.GetCallingScriptHash',
    result: [new BufferStackItem(Buffer.alloc(0, 0))],
    gas: FEES.ONE,
  },
  {
    name: 'System.ExecutionEngine.GetEntryScriptHash',
    result: ({ transaction }) => [
      new UInt160StackItem(crypto.toScriptHash(transaction.script)),
    ],
    gas: FEES.ONE,
  },
]: Array<TestCase>);

const handleCall = (sb: ScriptBuilder, call: Call) => {
  if (call.args != null) {
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

const handleArgs = (sb: ScriptBuilder, args: Array<Arg>) => {
  for (let i = args.length - 1; i >= 0; i -= 1) {
    const arg = args[i];
    if (
      arg != null &&
      typeof arg === 'object' &&
      arg.type === 'calls' &&
      arg.calls != null
    ) {
      ((arg.calls: $FlowFixMe): Array<Call>).forEach(call => {
        handleCall(sb, call);
      });
    } else {
      sb.emitPushParam((arg: $FlowFixMe));
    }
  }
};

describe('syscalls', () => {
  const filterMethods = value => {
    if (value == null) {
      return value;
    } else if (Array.isArray(value)) {
      return value.map(val => filterMethods(val));
    } else if (typeof value === 'function') {
      return undefined;
    } else if (typeof value === 'object') {
      const result = {};
      for (const [key, val] of commonUtils.entries(value)) {
        result[key] = filterMethods(val);
      }
      return result;
    }

    return value;
  };

  for (const testCase of SYSCALLS) {
    const {
      name,
      result,
      gas,
      args = [],
      actionIndex = 0,
      mock,
      options,
    } = testCase;
    it(name, async () => {
      const sb = new ScriptBuilder();
      sb.emitSysCall(name);
      const transaction = transactions.createInvocation({
        script: sb.build(),
        attributes: [
          new UInt160Attribute({
            usage: ATTRIBUTE_USAGE.SCRIPT,
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
        transactionSpentCoins: {},
      };
      const block = {
        timestamp: blockTime,
      };
      const init = {
        scriptContainer: {
          type: SCRIPT_CONTAINER_TYPE.TRANSACTION,
          value: transaction,
        },
        triggerType,
        action: NULL_ACTION,
        listeners: {},
        skipWitnessVerify: false,
        persistingBlock: (block: $FlowFixMe),
      };
      const gasLeft = common.ONE_HUNDRED_MILLION_FIXED8;
      let stack = [];

      if (mock != null) {
        mock({ blockchain });
      }

      if (args.length) {
        const argsSB = new ScriptBuilder();
        handleArgs(argsSB, args);

        const argsContext = await executeScript({
          monitor,
          code: argsSB.build(),
          blockchain: (blockchain: $FlowFixMe),
          init,
          gasLeft,
        });
        ({ stack } = argsContext);
        expect(argsContext.errorMessage).toBeUndefined();
      }

      const context = await executeScript({
        monitor,
        code: transaction.script,
        blockchain: (blockchain: $FlowFixMe),
        init,
        gasLeft,
        options: options || ({ stack }: $FlowFixMe),
      });

      expect(context.errorMessage).toBeUndefined();
      if (Array.isArray(result)) {
        expect(filterMethods(context.stack)).toEqual(filterMethods(result));
      } else {
        const expectedResult = result({ transaction });
        if (Array.isArray(expectedResult)) {
          expect(context.stack).toEqual(expectedResult);
        } else {
          expectedResult(context.stack);
        }
      }
      expect(context.actionIndex).toEqual(actionIndex);
      expect(gasLeft.sub(context.gasLeft).toString(10)).toEqual(
        gas.toString(10),
      );
      testUtils.verifyBlockchainSnapshot(blockchain);
    });
  }
});
