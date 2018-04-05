/* @flow */
import type BN from 'bn.js';
import {
  type ExecutionAction,
  type Script,
  type ExecuteScriptsResult,
  type TriggerType,
  type VMListeners,
  type WriteBlockchain,
} from '@neo-one/node-core';
import {
  VM_STATE,
  type Block,
  type ScriptContainer,
  crypto,
  utils,
} from '@neo-one/client-core';
import type { Monitor } from '@neo-one/monitor';

import { labels } from '@neo-one/utils';

import {
  type ExecutionContext,
  type ExecutionInit,
  type Options,
  FREE_GAS,
  MAX_ARRAY_SIZE,
  MAX_INVOCATION_STACK_SIZE,
  MAX_ITEM_SIZE,
  MAX_STACK_SIZE,
} from './constants';
import {
  AltStackUnderflowError,
  ArrayOverflowError,
  InvocationStackOverflowError,
  ItemOverflowError,
  OutOfGASError,
  StackOverflowError,
  StackUnderflowError,
  UnknownError,
  VMError,
} from './errors';

import { lookupOp } from './opcodes';

const getErrorMessage = (error: Error) => `${error.message}\n${error.stack}`;

const executeNext = async ({
  monitor,
  context: contextIn,
}: {|
  monitor: Monitor,
  context: ExecutionContext,
|}): Promise<ExecutionContext> => {
  let context = contextIn;
  if (context.state !== VM_STATE.NONE) {
    return context;
  }

  if (context.pc >= context.code.length) {
    return {
      ...(context: $FlowFixMe),
      state: VM_STATE.HALT,
    };
  }

  const op = lookupOp({ context });
  // eslint-disable-next-line
  context = op.context;

  if (context.stack.length < op.in) {
    throw new StackUnderflowError(
      context,
      op.name,
      context.stack.length,
      op.in,
    );
  }

  if (context.stackAlt.length < op.inAlt) {
    throw new AltStackUnderflowError(context);
  }

  const stackSize =
    context.stack.length +
    context.stackAlt.length +
    op.out +
    op.outAlt +
    op.modify +
    op.modifyAlt -
    op.in -
    op.inAlt;
  if (stackSize > MAX_STACK_SIZE) {
    throw new StackOverflowError(context);
  }

  if (context.depth + op.invocation > MAX_INVOCATION_STACK_SIZE) {
    throw new InvocationStackOverflowError(context);
  }

  if (op.array > MAX_ARRAY_SIZE) {
    throw new ArrayOverflowError(context);
  }

  if (op.item > MAX_ITEM_SIZE) {
    throw new ItemOverflowError(context);
  }

  const args = context.stack.slice(0, op.in);
  const argsAlt = context.stackAlt.slice(0, op.inAlt);

  context = {
    ...context,
    stack: context.stack.slice(op.in),
    stackAlt: context.stackAlt.slice(op.inAlt),
    gasLeft: context.gasLeft.sub(op.fee),
  };

  if (context.gasLeft.lt(utils.ZERO)) {
    throw new OutOfGASError(context);
  }

  let result;
  try {
    result = await monitor
      .withLabels({ [labels.OP_CODE]: op.name })
      .captureSpanLog(
        span => op.invoke({ monitor: span, context, args, argsAlt }),
        {
          name: 'neo_execute_op',
          level: { log: 'debug', span: 'debug' },
          error: { level: 'debug' },
        },
      );
  } catch (error) {
    if (error.code === 'VM_ERROR') {
      throw error;
    }
    const newError = new VMError(context, `VM Error: ${error.message}`);
    newError.stack = error.stack;
    throw newError;
  }

  const { context: newContext, results, resultsAlt } = result;
  context = newContext;

  if (op.out > 0) {
    if (results == null || results.length !== op.out) {
      throw new UnknownError(context);
    } else {
      context = {
        ...context,
        stack: [...results].reverse().concat(context.stack),
      };
    }
  } else if (results != null) {
    throw new UnknownError(context);
  }

  if (op.outAlt > 0) {
    if (resultsAlt == null || resultsAlt.length !== op.outAlt) {
      throw new UnknownError(context);
    } else {
      context = {
        ...context,
        stackAlt: [...resultsAlt].reverse().concat(context.stackAlt),
      };
    }
  } else if (resultsAlt != null) {
    throw new UnknownError(context);
  }

  return (context: $FlowFixMe);
};

const run = async ({
  monitor,
  context: contextIn,
}: {|
  monitor: Monitor,
  context: ExecutionContext,
|}): Promise<ExecutionContext> => {
  let context = contextIn;
  while (context.state === VM_STATE.NONE) {
    try {
      // eslint-disable-next-line
      context = await executeNext({ monitor, context });
    } catch (error) {
      context = {
        state: VM_STATE.FAULT,
        errorMessage: getErrorMessage(error),
        blockchain: context.blockchain,
        init: context.init,
        engine: context.engine,
        code: context.code,
        pushOnly: context.pushOnly,
        scriptHash: context.scriptHash,
        callingScriptHash: context.callingScriptHash,
        entryScriptHash: context.entryScriptHash,
        pc: context.pc,
        depth: context.depth,
        stack: context.stack,
        stackAlt: context.stackAlt,
        gasLeft: context.gasLeft,
        actionIndex: context.actionIndex,
        createdContracts: context.createdContracts,
      };
    }
  }

  return context;
};

export const executeScript = async ({
  monitor,
  code,
  pushOnly,
  blockchain,
  init,
  gasLeft,
  options: optionsIn,
}: {|
  monitor: Monitor,
  code: Buffer,
  pushOnly?: boolean,
  blockchain: WriteBlockchain,
  init: ExecutionInit,
  gasLeft: BN,
  options?: Options,
|}): Promise<ExecutionContext> => {
  const options = optionsIn || {};
  const scriptHash = crypto.hash160(code);

  const context = {
    state: VM_STATE.NONE,
    blockchain,
    init,
    engine: {
      run,
      executeScript,
    },
    code,
    pushOnly: !!pushOnly,
    scriptHash,
    callingScriptHash: options.scriptHash || null,
    entryScriptHash: options.entryScriptHash || scriptHash,
    pc: 0,
    depth: options.depth || 1,
    stack: options.stack || [],
    stackAlt: options.stackAlt || [],
    gasLeft,
    actionIndex: options.actionIndex || 0,
    createdContracts: options.createdContracts || {},
  };

  return monitor.captureSpanLog(span => run({ monitor: span, context }), {
    name: 'neo_execute_script',
    level: { log: 'debug', span: 'debug' },
    error: { level: 'debug' },
  });
};

export default async ({
  monitor: monitorIn,
  scripts,
  blockchain,
  scriptContainer,
  triggerType,
  action,
  gas: gasIn,
  listeners,
  skipWitnessVerify,
  persistingBlock,
}: {|
  monitor: Monitor,
  scripts: Array<Script>,
  blockchain: WriteBlockchain,
  scriptContainer: ScriptContainer,
  triggerType: TriggerType,
  action: ExecutionAction,
  gas: BN,
  listeners?: VMListeners,
  skipWitnessVerify?: boolean,
  persistingBlock?: Block,
|}): Promise<ExecuteScriptsResult> => {
  const monitor = monitorIn.at('vm');
  const init = {
    scriptContainer,
    triggerType,
    action,
    listeners: listeners || {},
    skipWitnessVerify: skipWitnessVerify || false,
    persistingBlock,
  };

  let context;
  const startingGas = gasIn.add(FREE_GAS);
  let gas = startingGas;
  let errorMessage;
  const span = monitor.startSpan({
    name: 'neo_execute_scripts',
    level: 'debug',
  });
  let err;
  try {
    const entryScriptHash = crypto.hash160(scripts[scripts.length - 1].code);
    for (
      let idx = 0;
      idx < scripts.length &&
      (context == null || context.state === VM_STATE.HALT);
      idx += 1
    ) {
      const script = scripts[idx];
      // NOTE: scriptHash has a different meaning here, it will be translated
      //       to callingScriptHash within executeScript. executeScript
      //       automatically hashes the input code to determine the current
      //       scriptHash.
      const scriptHash =
        idx + 1 < scripts.length ? crypto.hash160(scripts[idx + 1].code) : null;
      let options = {
        depth: scripts.length - idx,
        stack: [],
        stackAlt: [],
        actionIndex: 0,
        createdContracts: {},
        scriptHash,
        entryScriptHash,
      };
      if (context != null) {
        options = {
          depth: scripts.length - idx,
          stack: context.stack,
          stackAlt: context.stackAlt,
          actionIndex: context.actionIndex,
          createdContracts: context.createdContracts,
          scriptHash,
          entryScriptHash,
        };
      }

      // eslint-disable-next-line
      context = await executeScript({
        monitor: span,
        code: script.code,
        pushOnly: script.pushOnly,
        blockchain,
        init,
        gasLeft: gas,
        options,
      });
      gas = context.gasLeft;
    }
  } catch (error) {
    err = error;
    errorMessage = getErrorMessage(error);
  } finally {
    span.end(err != null);
  }

  const finalContext = context;
  if (finalContext == null) {
    return {
      state: errorMessage == null ? VM_STATE.HALT : VM_STATE.FAULT,
      stack: [],
      stackAlt: [],
      gasConsumed: utils.ZERO,
      errorMessage,
    };
  }

  let gasConsumed = startingGas.sub(finalContext.gasLeft).sub(FREE_GAS);
  if (gasConsumed.lt(utils.ZERO)) {
    gasConsumed = utils.ZERO;
  }

  return {
    state: errorMessage == null ? finalContext.state : VM_STATE.FAULT,
    stack: finalContext.stack.map(item => item.toContractParameter()),
    stackAlt: finalContext.stackAlt.map(item => item.toContractParameter()),
    gasConsumed,
    errorMessage:
      errorMessage == null ? finalContext.errorMessage : errorMessage,
  };
};
