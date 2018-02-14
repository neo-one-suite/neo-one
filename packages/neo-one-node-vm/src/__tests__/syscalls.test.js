/* @flow */
/* eslint-disable no-param-reassign */
import { NULL_ACTION, TRIGGER_TYPE } from '@neo-one/node-core';
import {
  type Param,
  type SysCallName,
  ATTRIBUTE_USAGE,
  SCRIPT_CONTAINER_TYPE,
  BinaryWriter,
  InvocationTransaction,
  UInt160Attribute,
  ScriptBuilder,
  common,
  crypto,
} from '@neo-one/client-core';
import BN from 'bn.js';
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';

import { utils as commonUtils } from '@neo-one/utils';

import { FEES } from '../constants';
import {
  STACK_ITEM_TYPE,
  type StackItem,
  BufferStackItem,
  BooleanStackItem,
  IntegerStackItem,
  StorageContextStackItem,
  TransactionStackItem,
  UInt160StackItem,
} from '../stackItem';

import { executeScript } from '../execute';
import { keys, transactions } from '../__data__';

const triggerType = TRIGGER_TYPE.APPLICATION;
const scriptAttributeHash = keys[0].scriptHash;
const blockTime = Date.now();

type Call = {|
  name: SysCallName,
  // eslint-disable-next-line
  args?: Array<Arg>,
|};
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
  // {
  //   name: 'Neo.Blockchain.GetHeight',
  // },
  // {
  //   name: 'Neo.Blockchain.GetHeader',
  // },
  // {
  //   name: 'Neo.Blockchain.GetBlock',
  // },
  // {
  //   name: 'Neo.Blockchain.GetTransaction',
  // },
  // {
  //   name: 'Neo.Blockchain.GetAccount',
  // },
  // {
  //   name: 'Neo.Blockchain.GetValidators',
  // },
  // {
  //   name: 'Neo.Blockchain.GetAsset',
  // },
  // {
  //   name: 'Neo.Blockchain.GetContract',
  // },
  // {
  //   name: 'Neo.Header.GetHash',
  // },
  // {
  //   name: 'Neo.Header.GetVersion',
  // },
  // {
  //   name: 'Neo.Header.GetPrevHash',
  // },
  // {
  //   name: 'Neo.Header.GetIndex',
  // },
  // {
  //   name: 'Neo.Header.GetMerkleRoot',
  // },
  // {
  //   name: 'Neo.Header.GetTimestamp',
  // },
  // {
  //   name: 'Neo.Header.GetConsensusData',
  // },
  // {
  //   name: 'Neo.Header.GetNextConsensus',
  // },
  // {
  //   name: 'Neo.Block.GetTransactionCount',
  // },
  // {
  //   name: 'Neo.Block.GetTransactions',
  // },
  // {
  //   name: 'Neo.Block.GetTransaction',
  // },
  // {
  //   name: 'Neo.Transaction.GetHash',
  // },
  // {
  //   name: 'Neo.Transaction.GetType',
  // },
  // {
  //   name: 'Neo.Transaction.GetAttributes',
  // },
  // {
  //   name: 'Neo.Transaction.GetInputs',
  // },
  // {
  //   name: 'Neo.Transaction.GetOutputs',
  // },
  // {
  //   name: 'Neo.Transaction.GetReferences',
  // },
  // {
  //   name: 'Neo.Transaction.GetUnspentCoins',
  // },
  // {
  //   name: 'Neo.InvocationTransaction.GetScript',
  // },
  // {
  //   name: 'Neo.Attribute.GetUsage',
  // },
  // {
  //   name: 'Neo.Attribute.GetData',
  // },
  // {
  //   name: 'Neo.Input.GetHash',
  // },
  // {
  //   name: 'Neo.Input.GetIndex',
  // },
  // {
  //   name: 'Neo.Output.GetAssetId',
  // },
  // {
  //   name: 'Neo.Output.GetValue',
  // },
  // {
  //   name: 'Neo.Output.GetScriptHash',
  // },
  // {
  //   name: 'Neo.Account.GetScriptHash',
  // },
  // {
  //   name: 'Neo.Account.GetVotes',
  // },
  // {
  //   name: 'Neo.Account.GetBalance',
  // },
  // {
  //   name: 'Neo.Asset.GetAssetId',
  // },
  // {
  //   name: 'Neo.Asset.GetAssetType',
  // },
  // {
  //   name: 'Neo.Asset.GetAmount',
  // },
  // {
  //   name: 'Neo.Asset.GetAvailable',
  // },
  // {
  //   name: 'Neo.Asset.GetPrecision',
  // },
  // {
  //   name: 'Neo.Asset.GetOwner',
  // },
  // {
  //   name: 'Neo.Asset.GetAdmin',
  // },
  // {
  //   name: 'Neo.Asset.GetIssuer',
  // },
  // {
  //   name: 'Neo.Contract.GetScript',
  // },
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
      { type: 'calls', calls: [{ name: 'Neo.Storage.GetContext' }] },
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
      { type: 'calls', calls: [{ name: 'Neo.Storage.GetContext' }] },
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
            args: [
              { type: 'calls', calls: [{ name: 'Neo.Storage.GetContext' }] },
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
            args: [
              { type: 'calls', calls: [{ name: 'Neo.Storage.GetContext' }] },
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
  // {
  //   name: 'Neo.Iterator.Key',
  // },
  // {
  //   name: 'Neo.Iterator.Value',
  // },
  // {
  //   name: 'Neo.Account.SetVotes',
  // },
  // {
  //   name: 'Neo.Validator.Register',
  // },
  // {
  //   name: 'Neo.Asset.Create',
  // },
  // {
  //   name: 'Neo.Asset.Renew',
  // },
  // {
  //   name: 'Neo.Contract.Create',
  // },
  // {
  //   name: 'Neo.Contract.Migrate',
  // },
  // {
  //   name: 'Neo.Contract.GetStorageContext',
  // },
  // {
  //   name: 'Neo.Contract.Destroy',
  // },
  {
    name: 'Neo.Storage.Put',
    result: [],
    args: [
      {
        type: 'calls',
        calls: [{ name: 'Neo.Storage.GetContext' }],
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
        calls: [{ name: 'Neo.Storage.GetContext' }],
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
        calls: [{ name: 'Neo.Storage.GetContext' }],
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
        calls: [{ name: 'Neo.Storage.GetContext' }],
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
        calls: [{ name: 'Neo.Storage.GetContext' }],
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
        calls: [{ name: 'Neo.Storage.GetContext' }],
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
  sb.emitSysCall(call.name);
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
  for (const testCase of SYSCALLS) {
    const { name, result, gas, args = [], actionIndex = 0, mock } = testCase;
    // eslint-disable-next-line
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
      };
      const block = { timestamp: blockTime };
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
          code: argsSB.build(),
          blockchain: (blockchain: $FlowFixMe),
          init,
          gasLeft,
        });
        ({ stack } = argsContext);
        expect(argsContext.errorMessage).toBeUndefined();
      }

      const context = await executeScript({
        code: transaction.script,
        blockchain: (blockchain: $FlowFixMe),
        init,
        gasLeft,
        options: ({ stack }: $FlowFixMe),
      });

      expect(context.errorMessage).toBeUndefined();
      if (Array.isArray(result)) {
        expect(context.stack).toEqual(result);
      } else {
        const expectedResult = result({ transaction });
        if (Array.isArray(expectedResult)) {
          expect(context.stack).toEqual(expectedResult);
        } else {
          expectedResult(result);
        }
      }
      expect(context.actionIndex).toEqual(actionIndex);
      expect(gasLeft.sub(context.gasLeft).toString(10)).toEqual(
        gas.toString(10),
      );
      commonUtils.values(blockchain).forEach(obj => {
        if (typeof obj === 'object') {
          commonUtils.values(obj).forEach(maybeMock => {
            if (maybeMock != null && maybeMock.mock != null) {
              expect(maybeMock.mock.calls).toMatchSnapshot();
            }
          });
        }
      });
    });
  }
});
