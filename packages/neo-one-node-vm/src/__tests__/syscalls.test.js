/* @flow */
import { NULL_ACTION, TRIGGER_TYPE } from '@neo-one/node-core';
import {
  type Param,
  type SysCallName,
  ATTRIBUTE_USAGE,
  SCRIPT_CONTAINER_TYPE,
  UInt160Attribute,
  ScriptBuilder,
  utils,
} from '@neo-one/client-core';
import BN from 'bn.js';

import { FEES } from '../constants';
import {
  type StackItem,
  BooleanStackItem,
  IntegerStackItem,
} from '../stackItem';

import { executeScript } from '../execute';
import { keys, transactions } from '../__data__';

const triggerType = TRIGGER_TYPE.APPLICATION;
const scriptAttributeHash = keys[0].scriptHash;
const blockTime = Date.now();

type TestCase = {|
  name: SysCallName,
  result: Array<StackItem>,
  gas: BN,
  args?: Array<?Param>,
  actionIndex?: number,
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
    gas: FEES.ONE,
    actionIndex: 1,
  },
  {
    name: 'Neo.Runtime.Log',
    result: [],
    args: ['foo'],
    gas: FEES.ONE,
    actionIndex: 1,
  },
  {
    name: 'Neo.Runtime.GetTime',
    result: [new IntegerStackItem(new BN(blockTime))],
    gas: FEES.ONE,
  },
  // {
  //   name: 'Neo.Runtime.Serialize',
  // },
  // {
  //   name: 'Neo.Runtime.Deserialize',
  // },
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
  // {
  //   name: 'Neo.Storage.GetContext',
  // },
  // {
  //   name: 'Neo.Storage.Get',
  // },
  // {
  //   name: 'Neo.Storage.Find',
  // },
  // {
  //   name: 'Neo.Iterator.Next',
  // },
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
  // {
  //   name: 'Neo.Storage.Put',
  // },
  // {
  //   name: 'Neo.Storage.Delete',
  // },
  // {
  //   name: 'System.ExecutionEngine.GetScriptContainer',
  // },
  // {
  //   name: 'System.ExecutionEngine.GetExecutingScriptHash',
  // },
  // {
  //   name: 'System.ExecutionEngine.GetCallingScriptHash',
  // },
  // {
  //   name: 'System.ExecutionEngine.GetEntryScriptHash',
  // },
]: Array<TestCase>);

describe('syscalls', () => {
  for (const testCase of SYSCALLS) {
    const { name, result, gas, args = [], actionIndex = 0 } = testCase;
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
        output: {},
        asset: {},
        action: {
          add: jest.fn(() => {}),
        },
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
      const gasLeft = utils.ONE_HUNDRED_MILLION;
      let stack = [];

      if (args.length) {
        const argsSB = new ScriptBuilder();
        argsSB.emitPushParams(...args);
        const argsContext = await executeScript({
          code: argsSB.build(),
          blockchain: (blockchain: $FlowFixMe),
          init,
          gasLeft,
        });
        ({ stack } = argsContext);
      }

      const context = await executeScript({
        code: transaction.script,
        blockchain: (blockchain: $FlowFixMe),
        init,
        gasLeft,
        options: ({ stack }: $FlowFixMe),
      });

      expect(context.errorMessage).toBeUndefined();
      expect(context.stack).toEqual(result);
      expect(context.actionIndex).toEqual(actionIndex);
      expect(gasLeft.sub(context.gasLeft).toString(10)).toEqual(
        gas.toString(10),
      );
      expect(blockchain.action.add.mock.calls).toMatchSnapshot();
    });
  }
});
