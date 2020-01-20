// tslint:disable no-object-mutation
import { common, OpCode, ScriptBuilder, ScriptBuilderParam, SysCallName } from '@neo-one/client-common';
import {
  AttributeUsage,
  Block,
  NULL_ACTION,
  ScriptContainerType,
  Transaction,
  TriggerType,
  UInt160Attribute,
  WriteBlockchain,
} from '@neo-one/node-core';
import { BN } from 'bn.js';
import { ExecutionInit, Options } from '../constants';
import { executeScript } from '../execute';
import { StackItem } from '../stackItem';
import { factory } from './factory';
import { keys } from './keys';
import * as transactions from './transactions';
import * as testUtils from './utils';

type flag = 'blockContainer' | 'consensusContainer' | 'useBadTransaction' | 'noPersistingBlock';

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
type Arg = ScriptBuilderParam | undefined | Calls;

export interface TestCase {
  readonly name: SysCallName;
  readonly result:
    | readonly StackItem[]
    | ((options: {
        readonly transaction: Transaction;
      }) => // tslint:disable-next-line no-any
      readonly StackItem[] | ((result: any) => void));

  readonly gas: BN;
  readonly args?: readonly Arg[];
  readonly options?: Partial<Options>;
  // tslint:disable-next-line no-any
  readonly mockBlockchain?: (options: { readonly blockchain: any }) => void;
  // tslint:disable-next-line no-any
  readonly mockTransaction?: (options: { readonly transaction: any }) => void;
  readonly error?: string;
  readonly flags?: Set<flag>;
}

export const triggerType = TriggerType.Application;
export const scriptAttributeHash = keys[0].scriptHash;
export const blockTime = new BN(Date.now());

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

export const runSysCalls = (sysCalls: readonly TestCase[]) => {
  // tslint:disable-next-line no-loop-statement
  for (const testCase of sysCalls) {
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
        index: 0,
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
};
