import { common, crypto, Op as OpCodeToByteCode, OpCode, UInt160, utils, VMState } from '@neo-one/client-core';
import bitwise from 'bitwise';
import { BN } from 'bn.js';
import _ from 'lodash';
import { ExecutionContext, ExecutionStack, FEES, getResultContext, Op, OpInvoke } from './constants';
import {
  CodeOverflowError,
  ContractNoDynamicInvokeError,
  InsufficientReturnValueError,
  InvalidCheckMultisigArgumentsError,
  InvalidHasKeyIndexError,
  InvalidPackCountError,
  InvalidPickItemKeyError,
  InvalidRemoveIndexError,
  InvalidSetItemIndexError,
  InvalidTailCallReturnValueError,
  LeftNegativeError,
  PickNegativeError,
  RightLengthError,
  RightNegativeError,
  RollNegativeError,
  StackUnderflowError,
  SubstrNegativeEndError,
  SubstrNegativeStartError,
  ThrowError,
  UnknownOpError,
  XDropNegativeError,
  XSwapNegativeError,
  XTuckNegativeError,
} from './errors';
import {
  ArrayStackItem,
  BooleanStackItem,
  BufferStackItem,
  IntegerStackItem,
  MapStackItem,
  StackItem,
  StructStackItem,
  UInt160StackItem,
  UInt256StackItem,
} from './stackItem';
import { lookupSysCall } from './syscalls';
import { vmUtils } from './vmUtils';

export type CreateOp = (
  input: CreateOpArgs,
) => {
  readonly op: Op;
  readonly context: ExecutionContext;
};

interface OpStatic {
  readonly type: 'op';
  readonly op: Op;
}

interface OpCreate {
  readonly type: 'create';
  readonly create: CreateOp;
}

type OpObject = OpStatic | OpCreate;

export interface CreateOpArgs {
  readonly context: ExecutionContext;
}

export const createOp = ({
  name,
  in: _in = 0,
  inAlt = 0,
  out = 0,
  outAlt = 0,
  modify = 0,
  modifyAlt = 0,
  invocation = 0,
  array = 0,
  item = 0,
  fee: feeIn,
  invoke,
}: {
  readonly name: OpCode;
  readonly in?: number;
  readonly inAlt?: number;
  readonly out?: number;
  readonly outAlt?: number;
  readonly modify?: number;
  readonly modifyAlt?: number;
  readonly invocation?: number;
  readonly array?: number;
  readonly item?: number;
  readonly fee?: BN;
  readonly invoke: OpInvoke;
}): OpStatic => {
  let fee = feeIn;
  if (fee === undefined) {
    const byteCode = OpCodeToByteCode[name];
    fee = byteCode <= OpCodeToByteCode.PUSH16 || byteCode === OpCodeToByteCode.NOP ? utils.ZERO : FEES.ONE;
  }

  return {
    type: 'op',
    op: {
      name,
      in: _in,
      inAlt,
      out,
      outAlt,
      modify,
      modifyAlt,
      invocation,
      array,
      item,
      fee,
      invoke,
    },
  };
};

const pushNumber = ({ name, value }: { readonly name: OpCode; readonly value: number }) =>
  createOp({
    name,
    out: 1,
    invoke: ({ context }) => ({
      context,
      results: [new IntegerStackItem(new BN(value))],
    }),
  });

const pushData = ({ name, numBytes }: { readonly name: OpCode; readonly numBytes: 1 | 2 | 4 }) =>
  createOp({
    name,
    out: 1,
    invoke: ({ context }) => {
      const { code, pc } = context;
      let size;
      if (numBytes === 1) {
        size = code.readUInt8(context.pc);
      } else if (numBytes === 2) {
        size = code.readUInt16LE(pc);
      } else {
        size = code.readInt32LE(pc);
      }

      if (code.length < pc + numBytes + size - 1) {
        throw new CodeOverflowError(context);
      }

      return {
        context: {
          ...context,
          pc: pc + numBytes + size,
        },

        results: [new BufferStackItem(code.slice(pc + numBytes, pc + numBytes + size))],
      };
    },
  });

const jump = ({ name, checkTrue }: { readonly name: OpCode; readonly checkTrue?: boolean }) =>
  createOp({
    name,
    in: checkTrue === undefined ? 0 : 1,
    invoke: ({ context, args }) => {
      const { code } = context;
      let { pc } = context;
      const offset = code.readInt16LE(pc);
      pc += 2;
      const newPC = pc + offset - 3;
      if (newPC < 0 || newPC > code.length) {
        throw new CodeOverflowError(context);
      }

      let shouldJump = true;
      if (checkTrue !== undefined) {
        shouldJump = args[0].asBoolean();
        if (!checkTrue) {
          shouldJump = !shouldJump;
        }
      }

      return {
        context: {
          ...context,
          pc: shouldJump ? newPC : pc,
        },
      };
    },
  });

const isDynamic = (hash: UInt160) => common.uInt160ToBuffer(hash).every((value) => value === 0);

const call = ({ name, tailCall }: { readonly name: OpCode; readonly tailCall?: boolean }): OpCreate => ({
  type: 'create',
  create: ({ context: contextIn }) => {
    const hashIn = common.bufferToUInt160(contextIn.code.slice(contextIn.pc, contextIn.pc + 20));

    const { op } = createOp({
      name,
      in: isDynamic(hashIn) ? 1 : 0,
      invocation: tailCall ? 0 : 1,
      fee: FEES.TEN,
      invoke: async ({ monitor, context, args }) => {
        const { pc, scriptHash } = context;
        let hash = common.bufferToUInt160(context.code.slice(pc, pc + 20));
        if (isDynamic(hash)) {
          hash = common.bufferToUInt160(args[0].asBuffer());

          const executingContract = await context.blockchain.contract.get({
            hash: scriptHash,
          });

          if (!executingContract.hasDynamicInvoke) {
            throw new ContractNoDynamicInvokeError(context, common.uInt160ToString(scriptHash));
          }
        }
        const contract = await context.blockchain.contract.get({ hash });
        const resultContext = await context.engine.executeScript({
          monitor,
          code: contract.script,
          blockchain: context.blockchain,
          init: context.init,
          gasLeft: context.gasLeft,
          options: {
            stack: context.stack,
            stackAlt: context.stackAlt,
            depth: tailCall ? context.depth : context.depth + 1,
            createdContracts: context.createdContracts,
            scriptHash: context.scriptHash,
            entryScriptHash: context.entryScriptHash,
            returnValueCount: -1,
          },
        });

        let { state } = resultContext;
        if (state === VMState.Halt) {
          // If it's a tail call, then the final recursive call executes the rest
          // of the script, and we just return immediately here.
          state = tailCall ? VMState.Halt : context.state;
        }

        return {
          context: {
            state,
            errorMessage: resultContext.errorMessage,
            blockchain: context.blockchain,
            init: context.init,
            engine: context.engine,
            code: context.code,
            scriptHash: context.scriptHash,
            callingScriptHash: context.callingScriptHash,
            entryScriptHash: context.entryScriptHash,
            pc: pc + 20,
            depth: context.depth,
            returnValueCount: context.returnValueCount,
            ...getResultContext(resultContext),
          },
        };
      },
    });

    return { op, context: contextIn };
  },
});

const callIsolated = ({
  name,
  dynamicCall,
  tailCall,
}: {
  readonly name: OpCode;
  readonly dynamicCall?: boolean;
  readonly tailCall?: boolean;
}): OpCreate => ({
  type: 'create',
  create: ({ context: contextIn }) => {
    const returnValueCount = contextIn.code.slice(contextIn.pc, contextIn.pc + 1)[0];
    const parametersCount = contextIn.code.slice(contextIn.pc + 1, contextIn.pc + 2)[0];

    const nextPC = dynamicCall ? contextIn.pc + 2 : contextIn.pc + 22;

    const { op } = createOp({
      name,
      in: parametersCount + (dynamicCall ? 1 : 0),
      invocation: tailCall ? 0 : 1,
      fee: FEES.TEN,
      invoke: async ({ monitor, context, args }) => {
        const { pc, scriptHash } = context;
        const hash = dynamicCall
          ? common.bufferToUInt160(args[0].asBuffer())
          : common.bufferToUInt160(context.code.slice(pc + 2, pc + 22));

        if (tailCall && context.returnValueCount !== returnValueCount) {
          throw new InvalidTailCallReturnValueError(context, context.returnValueCount, returnValueCount);
        }

        if (dynamicCall) {
          const executingContract = await context.blockchain.contract.get({
            hash: scriptHash,
          });

          if (!executingContract.hasDynamicInvoke) {
            throw new ContractNoDynamicInvokeError(context, common.uInt160ToString(scriptHash));
          }
        }

        const contract = await context.blockchain.contract.get({ hash });
        const resultContext = await context.engine.executeScript({
          monitor,
          code: contract.script,
          blockchain: context.blockchain,
          init: context.init,
          gasLeft: context.gasLeft,
          options: {
            stack: dynamicCall ? args.slice(1) : args,
            stackAlt: [],
            depth: tailCall ? context.depth : context.depth + 1,
            createdContracts: context.createdContracts,
            scriptHash: context.scriptHash,
            entryScriptHash: context.entryScriptHash,
            returnValueCount,
          },
        });

        let { state } = resultContext;
        if (state === VMState.Halt) {
          // If it's a tail call, then the final recursive call executes the rest
          // of the script, and we just return immediately here.
          state = tailCall ? VMState.Halt : context.state;
        }

        let stack: ExecutionStack = [];
        if (returnValueCount === -1) {
          stack = resultContext.stack;
        } else if (returnValueCount > 0) {
          if (resultContext.stack.length < returnValueCount) {
            throw new InsufficientReturnValueError(context, resultContext.stack.length, returnValueCount);
          }

          stack = resultContext.stack.slice(0, returnValueCount);
        }

        return {
          context: {
            state,
            errorMessage: resultContext.errorMessage,
            blockchain: context.blockchain,
            init: context.init,
            engine: context.engine,
            code: context.code,
            scriptHash: context.scriptHash,
            callingScriptHash: context.callingScriptHash,
            entryScriptHash: context.entryScriptHash,
            pc: nextPC,
            depth: context.depth,
            returnValueCount: context.returnValueCount,
            stack: stack.concat(context.stack),
            stackAlt: context.stackAlt,
            gasLeft: resultContext.gasLeft,
            createdContracts: resultContext.createdContracts,
          },
        };
      },
    });

    return { op, context: contextIn };
  },
});

const functionCallIsolated = ({ name }: { readonly name: OpCode }): OpCreate => ({
  type: 'create',
  create: ({ context: contextIn }) => {
    const returnValueCount = contextIn.code.slice(contextIn.pc, contextIn.pc + 1)[0];
    const parametersCount = contextIn.code.slice(contextIn.pc + 1, contextIn.pc + 2)[0];

    const nextPC = contextIn.pc + 2;

    const { op } = createOp({
      name,
      in: parametersCount,
      invocation: 1,
      invoke: async ({ monitor, context, args }) => {
        const { pc } = context;

        const resultContext = await context.engine.executeScript({
          monitor,
          code: Buffer.concat([
            context.code.slice(0, pc - 1),
            Buffer.from([OpCodeToByteCode.JMP]),
            context.code.slice(pc),
          ]),
          blockchain: context.blockchain,
          init: context.init,
          gasLeft: context.gasLeft,
          options: {
            stack: args,
            stackAlt: [],
            depth: context.depth + 1,
            createdContracts: context.createdContracts,
            scriptHash: context.scriptHash,
            entryScriptHash: context.entryScriptHash,
            returnValueCount,
            pc: pc - 1,
          },
        });

        let { state } = resultContext;
        if (state === VMState.Halt) {
          state = context.state;
        }

        let stack: ExecutionStack = [];
        if (returnValueCount === -1) {
          stack = resultContext.stack;
        } else if (returnValueCount > 0) {
          if (resultContext.stack.length < returnValueCount) {
            throw new InsufficientReturnValueError(context, resultContext.stack.length, returnValueCount);
          }

          stack = resultContext.stack.slice(0, returnValueCount);
        }

        return {
          context: {
            state,
            errorMessage: resultContext.errorMessage,
            blockchain: context.blockchain,
            init: context.init,
            engine: context.engine,
            code: context.code,
            scriptHash: context.scriptHash,
            callingScriptHash: context.callingScriptHash,
            entryScriptHash: context.entryScriptHash,
            pc: nextPC + 2,
            depth: context.depth,
            returnValueCount: context.returnValueCount,
            stack,
            stackAlt: context.stackAlt,
            gasLeft: resultContext.gasLeft,
            createdContracts: resultContext.createdContracts,
          },
        };
      },
    });

    return { op, context: contextIn };
  },
});

const JMP = jump({ name: 'JMP' });

const OPCODE_PAIRS = ([
  [
    0x00,
    createOp({
      name: 'PUSH0',
      out: 1,
      invoke: ({ context }) => ({
        context,
        results: [new BufferStackItem(Buffer.alloc(0, 0))],
      }),
    }),
  ],
] as ReadonlyArray<[number, OpObject]>)
  .concat(
    _.range(0x01, 0x4c).map<[number, OpObject]>((idx) => [
      idx,
      createOp({
        // tslint:disable-next-line no-any
        name: `PUSHBYTES${idx}` as any,
        out: 1,
        invoke: ({ context }) => ({
          context: {
            ...context,
            pc: context.pc + idx,
          },
          results: [new BufferStackItem(context.code.slice(context.pc, context.pc + idx))],
        }),
      }),
    ]),
  )
  .concat([
    [0x4c, pushData({ name: 'PUSHDATA1', numBytes: 1 })],
    [0x4d, pushData({ name: 'PUSHDATA2', numBytes: 2 })],
    [0x4e, pushData({ name: 'PUSHDATA4', numBytes: 4 })],
    [0x4f, pushNumber({ name: 'PUSHM1', value: -1 })],
  ])
  .concat(
    _.range(0x51, 0x61).map<[number, OpObject]>((idx) => {
      const value = idx - 0x50;

      // tslint:disable-next-line no-any
      return [idx, pushNumber({ name: `PUSH${value}` as any, value })];
    }),
  )
  .concat([
    [
      0x61,
      createOp({
        name: 'NOP',
        invoke: ({ context }) => ({ context }),
      }),
    ],
    [0x62, JMP],
    [0x63, jump({ name: 'JMPIF', checkTrue: true })],
    [0x64, jump({ name: 'JMPIFNOT', checkTrue: false })],
    [
      0x65,
      createOp({
        name: 'CALL',
        invocation: 1,
        invoke: async ({ monitor, context }) => {
          const { pc } = context;
          // High level:
          // Execute JMP in place of current op codes pc using same context
          // Continue running after JMP until done
          // Set current pc to pc + 2
          const { op } = JMP;
          const { context: startContext } = await op.invoke({
            monitor,
            context: {
              ...context,
              callingScriptHash: context.scriptHash,
            },
            args: [],
            argsAlt: [],
          });

          const resultContext = await context.engine.run({
            monitor,
            context: {
              ...startContext,
              depth: context.depth + 1,
            },
          });

          return {
            context: {
              ...resultContext,
              callingScriptHash: context.callingScriptHash,
              pc: pc + 2,
              state: resultContext.state === VMState.Fault ? VMState.Fault : VMState.None,
              depth: context.depth,
            },
          };
        },
      }),
    ],
    [
      0x66,
      createOp({
        name: 'RET',
        invoke: ({ context }) => ({
          context: { ...context, state: VMState.Halt },
        }),
      }),
    ],
    [0x67, call({ name: 'APPCALL' })],
    [
      0x68,
      {
        type: 'create',
        create: ({ context }) => {
          const sysCall = lookupSysCall({ context });

          return {
            op: {
              name: 'SYSCALL',
              in: sysCall.in,
              inAlt: sysCall.inAlt,
              out: sysCall.out,
              outAlt: sysCall.outAlt,
              modify: sysCall.modify,
              modifyAlt: sysCall.modifyAlt,
              invocation: sysCall.invocation,
              array: sysCall.array,
              item: sysCall.item,
              fee: sysCall.fee,
              invoke: sysCall.invoke,
            },
            context: sysCall.context,
          };
        },
      },
    ],
    [0x69, call({ name: 'TAILCALL', tailCall: true })],
    [
      0x6a,
      createOp({
        name: 'DUPFROMALTSTACK',
        inAlt: 1,
        out: 1,
        outAlt: 1,
        invoke: ({ context, argsAlt }) => ({
          context,
          results: [argsAlt[0]],
          resultsAlt: [argsAlt[0]],
        }),
      }),
    ],
    [
      0x6b,
      createOp({
        name: 'TOALTSTACK',
        in: 1,
        outAlt: 1,
        invoke: ({ context, args }) => ({
          context,
          resultsAlt: [args[0]],
        }),
      }),
    ],
    [
      0x6c,
      createOp({
        name: 'FROMALTSTACK',
        inAlt: 1,
        out: 1,
        invoke: ({ context, argsAlt }) => ({
          context,
          results: [argsAlt[0]],
        }),
      }),
    ],
    [
      0x6d,
      createOp({
        name: 'XDROP',
        in: 1,
        modify: -1,
        invoke: ({ context, args }) => {
          const n = vmUtils.toNumber(context, args[0].asBigInteger());
          if (n < 0) {
            throw new XDropNegativeError(context);
          }

          const { stack } = context;

          return {
            context: {
              ...context,
              stack: stack.slice(0, n).concat(stack.slice(n + 1)),
            },
          };
        },
      }),
    ],
    [
      0x72,
      createOp({
        name: 'XSWAP',
        in: 1,
        invoke: ({ context, args }) => {
          const n = vmUtils.toNumber(context, args[0].asBigInteger());
          if (n < 0) {
            throw new XSwapNegativeError(context);
          }

          const mutableStack = [...context.stack];
          mutableStack[n] = context.stack[0];
          mutableStack[0] = context.stack[n];

          return { context: { ...context, stack: mutableStack } };
        },
      }),
    ],
    [
      0x73,
      createOp({
        name: 'XTUCK',
        in: 1,
        modify: 1,
        invoke: ({ context, args }) => {
          const n = vmUtils.toNumber(context, args[0].asBigInteger());
          if (n <= 0) {
            throw new XTuckNegativeError(context);
          }

          const { stack } = context;

          return {
            context: {
              ...context,
              stack: stack
                .slice(0, n)
                .concat([stack[0]])
                .concat(stack.slice(n)),
            },
          };
        },
      }),
    ],
    [
      0x74,
      createOp({
        name: 'DEPTH',
        out: 1,
        invoke: ({ context }) => ({
          context,
          results: [new IntegerStackItem(new BN(context.stack.length))],
        }),
      }),
    ],
    [
      0x75,
      createOp({
        name: 'DROP',
        in: 1,
        invoke: ({ context }) => ({ context }),
      }),
    ],
    [
      0x76,
      createOp({
        name: 'DUP',
        in: 1,
        out: 2,
        invoke: ({ context, args }) => ({
          context,
          results: [args[0], args[0]],
        }),
      }),
    ],
    [
      0x77,
      createOp({
        name: 'NIP',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [args[0]],
        }),
      }),
    ],
    [
      0x78,
      createOp({
        name: 'OVER',
        in: 2,
        out: 3,
        invoke: ({ context, args }) => ({
          context,
          results: [args[1], args[0], args[1]],
        }),
      }),
    ],
    [
      0x79,
      createOp({
        name: 'PICK',
        in: 1,
        out: 1,
        invoke: ({ context, args }) => {
          const n = vmUtils.toNumber(context, args[0].asBigInteger());
          if (n < 0) {
            throw new PickNegativeError(context);
          }
          if (n >= context.stack.length) {
            throw new StackUnderflowError(context, 'PICK', context.stack.length, n + 1);
          }

          return { context, results: [context.stack[n]] };
        },
      }),
    ],
    [
      0x7a,
      createOp({
        name: 'ROLL',
        in: 1,
        out: 1,
        modify: -1,
        invoke: ({ context, args }) => {
          const n = vmUtils.toNumber(context, args[0].asBigInteger());
          if (n < 0) {
            throw new RollNegativeError(context);
          }
          if (n >= context.stack.length) {
            throw new StackUnderflowError(context, 'ROLL', context.stack.length, n + 1);
          }

          const { stack } = context;

          return {
            context: {
              ...context,
              stack: stack.slice(0, n).concat(stack.slice(n + 1)),
            },

            results: [context.stack[n]],
          };
        },
      }),
    ],
    [
      0x7b,
      createOp({
        name: 'ROT',
        in: 3,
        out: 3,
        invoke: ({ context, args }) => ({
          context,
          results: [args[1], args[0], args[2]],
        }),
      }),
    ],
    [
      0x7c,
      createOp({
        name: 'SWAP',
        in: 2,
        out: 2,
        invoke: ({ context, args }) => ({
          context,
          results: [args[0], args[1]],
        }),
      }),
    ],
    [
      0x7d,
      createOp({
        name: 'TUCK',
        in: 2,
        out: 3,
        invoke: ({ context, args }) => ({
          context,
          results: [args[0], args[1], args[0]],
        }),
      }),
    ],
    [
      0x7e,
      createOp({
        name: 'CAT',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BufferStackItem(Buffer.concat([args[1].asBuffer(), args[0].asBuffer()]))],
        }),
      }),
    ],
    [
      0x7f,
      createOp({
        name: 'SUBSTR',
        in: 3,
        out: 1,
        invoke: ({ context, args }) => {
          const end = vmUtils.toNumber(context, args[0].asBigInteger());
          if (end < 0) {
            throw new SubstrNegativeEndError(context);
          }

          const start = vmUtils.toNumber(context, args[1].asBigInteger());
          if (start < 0) {
            throw new SubstrNegativeStartError(context);
          }

          return {
            context,
            results: [new BufferStackItem(args[2].asBuffer().slice(start, start + end))],
          };
        },
      }),
    ],
    [
      0x80,
      createOp({
        name: 'LEFT',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => {
          const count = vmUtils.toNumber(context, args[0].asBigInteger());
          if (count < 0) {
            throw new LeftNegativeError(context);
          }

          return {
            context,
            results: [new BufferStackItem(args[1].asBuffer().slice(0, count))],
          };
        },
      }),
    ],
    [
      0x81,
      createOp({
        name: 'RIGHT',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => {
          const count = vmUtils.toNumber(context, args[0].asBigInteger());
          if (count < 0) {
            throw new RightNegativeError(context);
          }

          const value = args[1].asBuffer();
          if (value.length < count) {
            throw new RightLengthError(context);
          }

          return {
            context,
            results: [new BufferStackItem(value.slice(-count))],
          };
        },
      }),
    ],
    [
      0x82,
      createOp({
        name: 'SIZE',
        in: 1,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(new BN(args[0].asBuffer().length))],
        }),
      }),
    ],
    [
      0x83,
      createOp({
        name: 'INVERT',
        in: 1,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [
            new IntegerStackItem(
              utils.fromSignedBuffer(bitwise.buffer.not(utils.toSignedBuffer(args[0].asBigInteger()))),
            ),
          ],
        }),
      }),
    ],
    [
      0x84,
      createOp({
        name: 'AND',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [
            new IntegerStackItem(vmUtils.bitwiseOp(bitwise.buffer.and, args[0].asBigInteger(), args[1].asBigInteger())),
          ],
        }),
      }),
    ],
    [
      0x85,
      createOp({
        name: 'OR',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [
            new IntegerStackItem(vmUtils.bitwiseOp(bitwise.buffer.or, args[0].asBigInteger(), args[1].asBigInteger())),
          ],
        }),
      }),
    ],
    [
      0x86,
      createOp({
        name: 'XOR',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [
            new IntegerStackItem(vmUtils.bitwiseOp(bitwise.buffer.xor, args[0].asBigInteger(), args[1].asBigInteger())),
          ],
        }),
      }),
    ],
    [
      0x87,
      createOp({
        name: 'EQUAL',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(args[0].equals(args[1]))],
        }),
      }),
    ],
    // [0x88, createOp({
    //   name: 'OP_EQUALVERIFY',
    //   invoke: ({ context }: OpInvokeArgs) => ({ context }),
    // })],
    // [0x89, createOp({
    //   name: 'OP_RESERVED1',
    //   invoke: ({ context }: OpInvokeArgs) => ({ context }),
    // })],
    // [0x8A, createOp({
    //   name: 'OP_RESERVED2',
    //   invoke: ({ context }: OpInvokeArgs) => ({ context }),
    // })],
    [
      0x8b,
      createOp({
        name: 'INC',
        in: 1,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(args[0].asBigInteger().add(utils.ONE))],
        }),
      }),
    ],
    [
      0x8c,
      createOp({
        name: 'DEC',
        in: 1,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(args[0].asBigInteger().sub(utils.ONE))],
        }),
      }),
    ],
    [
      0x8d,
      createOp({
        name: 'SIGN',
        in: 1,
        out: 1,
        invoke: ({ context, args }) => {
          const value = args[0].asBigInteger();
          const mutableResults = [];
          if (value.isZero()) {
            mutableResults.push(new IntegerStackItem(utils.ZERO));
          } else if (value.isNeg()) {
            mutableResults.push(new IntegerStackItem(utils.NEGATIVE_ONE));
          } else {
            mutableResults.push(new IntegerStackItem(utils.ONE));
          }

          return { context, results: mutableResults };
        },
      }),
    ],
    [
      0x8f,
      createOp({
        name: 'NEGATE',
        in: 1,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(args[0].asBigInteger().neg())],
        }),
      }),
    ],
    [
      0x90,
      createOp({
        name: 'ABS',
        in: 1,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(args[0].asBigInteger().abs())],
        }),
      }),
    ],
    [
      0x91,
      createOp({
        name: 'NOT',
        in: 1,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(!args[0].asBoolean())],
        }),
      }),
    ],
    [
      0x92,
      createOp({
        name: 'NZ',
        in: 1,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(!args[0].asBigInteger().isZero())],
        }),
      }),
    ],
    [
      0x93,
      createOp({
        name: 'ADD',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(args[1].asBigInteger().add(args[0].asBigInteger()))],
        }),
      }),
    ],
    [
      0x94,
      createOp({
        name: 'SUB',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(args[1].asBigInteger().sub(args[0].asBigInteger()))],
        }),
      }),
    ],
    [
      0x95,
      createOp({
        name: 'MUL',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(args[1].asBigInteger().mul(args[0].asBigInteger()))],
        }),
      }),
    ],
    [
      0x96,
      createOp({
        name: 'DIV',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(args[1].asBigInteger().div(args[0].asBigInteger()))],
        }),
      }),
    ],
    [
      0x97,
      createOp({
        name: 'MOD',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(args[1].asBigInteger().mod(args[0].asBigInteger()))],
        }),
      }),
    ],
    [
      0x98,
      createOp({
        name: 'SHL',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(vmUtils.shiftLeft(args[1].asBigInteger(), args[0].asBigInteger()))],
        }),
      }),
    ],
    [
      0x99,
      createOp({
        name: 'SHR',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(vmUtils.shiftRight(args[1].asBigInteger(), args[0].asBigInteger()))],
        }),
      }),
    ],
    [
      0x9a,
      createOp({
        name: 'BOOLAND',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(args[0].asBoolean() && args[1].asBoolean())],
        }),
      }),
    ],
    [
      0x9b,
      createOp({
        name: 'BOOLOR',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(args[0].asBoolean() || args[1].asBoolean())],
        }),
      }),
    ],
    [
      0x9c,
      createOp({
        name: 'NUMEQUAL',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(args[0].asBigInteger().eq(args[1].asBigInteger()))],
        }),
      }),
    ],
    [
      0x9e,
      createOp({
        name: 'NUMNOTEQUAL',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(!args[0].asBigInteger().eq(args[1].asBigInteger()))],
        }),
      }),
    ],
    [
      0x9f,
      createOp({
        name: 'LT',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(args[1].asBigInteger().lt(args[0].asBigInteger()))],
        }),
      }),
    ],
    [
      0xa0,
      createOp({
        name: 'GT',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(args[1].asBigInteger().gt(args[0].asBigInteger()))],
        }),
      }),
    ],
    [
      0xa1,
      createOp({
        name: 'LTE',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(args[1].asBigInteger().lte(args[0].asBigInteger()))],
        }),
      }),
    ],
    [
      0xa2,
      createOp({
        name: 'GTE',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(args[1].asBigInteger().gte(args[0].asBigInteger()))],
        }),
      }),
    ],
    [
      0xa3,
      createOp({
        name: 'MIN',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(BN.min(args[1].asBigInteger(), args[0].asBigInteger()))],
        }),
      }),
    ],
    [
      0xa4,
      createOp({
        name: 'MAX',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(BN.max(args[1].asBigInteger(), args[0].asBigInteger()))],
        }),
      }),
    ],
    [
      0xa5,
      createOp({
        name: 'WITHIN',
        in: 3,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [
            new BooleanStackItem(
              args[1].asBigInteger().lte(args[2].asBigInteger()) && args[2].asBigInteger().lt(args[0].asBigInteger()),
            ),
          ],
        }),
      }),
    ],
    [
      0xa7,
      createOp({
        name: 'SHA1',
        in: 1,
        out: 1,
        fee: FEES.TEN,
        invoke: ({ context, args }) => ({
          context,
          results: [new BufferStackItem(crypto.sha1(args[0].asBuffer()))],
        }),
      }),
    ],
    [
      0xa8,
      createOp({
        name: 'SHA256',
        in: 1,
        out: 1,
        fee: FEES.TEN,
        invoke: ({ context, args }) => ({
          context,
          results: [new BufferStackItem(crypto.sha256(args[0].asBuffer()))],
        }),
      }),
    ],
    [
      0xa9,
      createOp({
        name: 'HASH160',
        in: 1,
        out: 1,
        fee: FEES.TWENTY,
        invoke: ({ context, args }) => ({
          context,
          results: [new UInt160StackItem(crypto.hash160(args[0].asBuffer()))],
        }),
      }),
    ],
    [
      0xaa,
      createOp({
        name: 'HASH256',
        in: 1,
        out: 1,
        fee: FEES.TWENTY,
        invoke: ({ context, args }) => ({
          context,
          results: [new UInt256StackItem(crypto.hash256(args[0].asBuffer()))],
        }),
      }),
    ],
    [
      0xac,
      createOp({
        name: 'CHECKSIG',
        in: 2,
        out: 1,
        fee: FEES.ONE_HUNDRED,
        invoke: async ({ context, args }) => {
          const publicKey = args[0].asECPoint();
          const signature = args[1].asBuffer();
          let result;
          try {
            result = await crypto.verify({
              message: context.init.scriptContainer.value.message,
              signature,
              publicKey,
            });
          } catch {
            result = false;
          }

          return {
            context,
            results: [new BooleanStackItem(result)],
          };
        },
      }),
    ],
    [
      0xad,
      createOp({
        name: 'VERIFY',
        in: 3,
        out: 1,
        invoke: async ({ context, args }) => {
          const publicKey = args[0].asECPoint();
          const signature = args[1].asBuffer();
          const message = args[2].asBuffer();
          let result;
          try {
            result = await crypto.verify({
              message,
              signature,
              publicKey,
            });
          } catch {
            result = false;
          }

          return {
            context,
            results: [new BooleanStackItem(result)],
          };
        },
      }),
    ],
    [
      0xae,
      {
        type: 'create',
        create: ({ context: contextIn }) => {
          const { stack } = contextIn;
          const top = stack[0] as StackItem | undefined;
          let pubKeyCount = 0;
          let _in;
          if (top === undefined || top.isArray()) {
            if (top !== undefined) {
              pubKeyCount = top.asArray().length;
            }
            _in = 1;
          } else {
            pubKeyCount = vmUtils.toNumber(contextIn, top.asBigInteger());
            if (pubKeyCount <= 0) {
              throw new InvalidCheckMultisigArgumentsError(contextIn);
            }
            _in = pubKeyCount + 1;
          }

          const next = stack[_in] as StackItem | undefined;
          if (next === undefined || next.isArray()) {
            _in += 1;
          } else {
            const sigCount = vmUtils.toNumber(contextIn, next.asBigInteger());
            if (sigCount < 0) {
              throw new InvalidCheckMultisigArgumentsError(contextIn);
            }
            _in += sigCount + 1;
          }

          const { op } = createOp({
            name: 'CHECKMULTISIG',
            in: _in,
            out: 1,
            fee: pubKeyCount === 0 ? FEES.ONE : FEES.ONE_HUNDRED.mul(new BN(pubKeyCount)),
            invoke: ({ context, args }) => {
              let index;
              let publicKeys;
              if (args[0].isArray()) {
                index = 1;
                publicKeys = args[0].asArray().map((value) => value.asECPoint());
              } else {
                const count = vmUtils.toNumber(context, args[0].asBigInteger());
                index = count + 1;
                publicKeys = args.slice(1, index).map((value) => value.asECPoint());
              }

              const signatures = args[index].isArray()
                ? args[index].asArray().map((value) => value.asBuffer())
                : args.slice(index + 1).map((value) => value.asBuffer());

              if (publicKeys.length === 0 || signatures.length === 0 || signatures.length > publicKeys.length) {
                throw new InvalidCheckMultisigArgumentsError(context);
              }

              let result = true;
              const n = publicKeys.length;
              const m = signatures.length;
              try {
                // tslint:disable-next-line no-loop-statement
                for (let i = 0, j = 0; result && i < m && j < n; ) {
                  const currentResult = crypto.verify({
                    message: context.init.scriptContainer.value.message,
                    signature: signatures[i],
                    publicKey: publicKeys[j],
                  });

                  if (currentResult) {
                    i += 1;
                  }
                  j += 1;
                  if (m - i > n - j) {
                    result = false;
                  }
                }
              } catch {
                result = false;
              }

              return {
                context,
                results: [new BooleanStackItem(result)],
              };
            },
          });

          return { op, context: contextIn };
        },
      },
    ],
    [
      0xc0,
      createOp({
        name: 'ARRAYSIZE',
        in: 1,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(new BN(args[0].size))],
        }),
      }),
    ],
    [
      0xc1,
      {
        type: 'create',
        create: ({ context: contextIn }) => {
          const { stack } = contextIn;
          const top = stack[0] as StackItem | undefined;
          let _in;
          if (top === undefined) {
            // This will cause the op to throw once it's executed.
            _in = 1;
          } else {
            _in = vmUtils.toNumber(contextIn, top.asBigInteger()) + 1;

            if (_in < 0) {
              throw new InvalidPackCountError(contextIn);
            }
          }

          const { op } = createOp({
            name: 'PACK',
            in: _in,
            out: 1,
            invoke: ({ context, args }) => ({
              context,
              results: [new ArrayStackItem(args.slice(1))],
            }),
          });

          return { op, context: contextIn };
        },
      },
    ],
    [
      0xc2,
      {
        type: 'create',
        create: ({ context: contextIn }) => {
          const { stack } = contextIn;
          const top = stack[0] as StackItem | undefined;
          const out = top === undefined ? 1 : top.asArray().length + 1;

          const { op } = createOp({
            name: 'UNPACK',
            in: 1,
            out,
            invoke: ({ context, args }) => {
              const arr = args[0].asArray();
              const mutableResults = [];
              // tslint:disable-next-line no-loop-statement
              for (let i = arr.length - 1; i >= 0; i -= 1) {
                mutableResults.push(arr[i]);
              }
              mutableResults.push(new IntegerStackItem(new BN(arr.length)));

              return { context, results: mutableResults };
            },
          });

          return { op, context: contextIn };
        },
      },
    ],
    [
      0xc3,
      createOp({
        name: 'PICKITEM',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => {
          if (args[1].isArray()) {
            const index = vmUtils.toNumber(context, args[0].asBigInteger());
            const val = args[1].asArray();
            if (index < 0 || index >= val.length) {
              throw new InvalidPickItemKeyError(context, `${index}`, JSON.stringify(args[1].toJSON()));
            }

            return { context, results: [val[index]] };
          }

          const key = args[0];
          const value = args[1].asMapStackItem();
          if (!value.has(key)) {
            throw new InvalidPickItemKeyError(context, key.toStructuralKey(), JSON.stringify(args[1].toJSON()));
          }

          return { context, results: [value.get(key)] };
        },
      }),
    ],
    [
      0xc4,
      createOp({
        name: 'SETITEM',
        in: 3,
        invoke: ({ context, args }) => {
          let newItem = args[0];
          if (newItem instanceof StructStackItem) {
            newItem = newItem.clone();
          }
          if (args[2].isArray()) {
            const index = vmUtils.toNumber(context, args[1].asBigInteger());
            const mutableValue = args[2].asArray();
            if (index < 0 || index >= mutableValue.length) {
              throw new InvalidSetItemIndexError(context);
            }

            mutableValue[index] = newItem;

            return { context };
          }

          const key = args[1];
          const value = args[2].asMapStackItem();
          value.set(key, newItem);

          return { context };
        },
      }),
    ],
    [
      0xc5,
      createOp({
        name: 'NEWARRAY',
        in: 1,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [
            new ArrayStackItem(
              _.range(0, vmUtils.toNumber(context, args[0].asBigInteger())).map(() => new BooleanStackItem(false)),
            ),
          ],
        }),
      }),
    ],
    [
      0xc6,
      createOp({
        name: 'NEWSTRUCT',
        in: 1,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [
            new StructStackItem(
              _.range(0, vmUtils.toNumber(context, args[0].asBigInteger())).map(() => new BooleanStackItem(false)),
            ),
          ],
        }),
      }),
    ],
    [
      0xc7,
      createOp({
        name: 'NEWMAP',
        out: 1,
        invoke: ({ context }) => ({
          context,
          results: [new MapStackItem()],
        }),
      }),
    ],
    [
      0xc8,
      createOp({
        name: 'APPEND',
        in: 2,
        invoke: ({ context, args }) => {
          let newItem = args[0];
          if (newItem instanceof StructStackItem) {
            newItem = newItem.clone();
          }
          const mutableValue = args[1].asArray();
          mutableValue.push(newItem);

          return { context };
        },
      }),
    ],
    [
      0xc9,
      createOp({
        name: 'REVERSE',
        in: 1,
        invoke: ({ context, args }) => {
          const mutableValue = args[0].asArray();
          mutableValue.reverse();

          return { context };
        },
      }),
    ],
    [
      0xca,
      createOp({
        name: 'REMOVE',
        in: 2,
        invoke: ({ context, args }) => {
          if (args[1].isArray()) {
            const index = vmUtils.toNumber(context, args[0].asBigInteger());
            const mutableValue = args[1].asArray();
            if (index < 0 || index >= mutableValue.length) {
              throw new InvalidRemoveIndexError(context, index);
            }
            mutableValue.splice(index, 1);

            return { context };
          }

          const key = args[0];
          const value = args[1].asMapStackItem();
          value.delete(key);

          return { context };
        },
      }),
    ],
    [
      0xcb,
      createOp({
        name: 'HASKEY',
        in: 2,
        out: 1,
        invoke: ({ context, args }) => {
          if (args[1].isArray()) {
            const index = vmUtils.toNumber(context, args[0].asBigInteger());
            const val = args[1].asArray();
            if (index < 0) {
              throw new InvalidHasKeyIndexError(context);
            }

            return {
              context,
              results: [new BooleanStackItem(index < val.length)],
            };
          }

          const key = args[0];
          const value = args[1].asMapStackItem();

          return {
            context,
            results: [new BooleanStackItem(value.has(key))],
          };
        },
      }),
    ],
    [
      0xcc,
      createOp({
        name: 'KEYS',
        in: 1,
        out: 1,
        invoke: ({ context, args }) => {
          const value = args[0].asMapStackItem();

          return { context, results: [value.keys()] };
        },
      }),
    ],
    [
      0xcd,
      createOp({
        name: 'VALUES',
        in: 1,
        out: 1,
        invoke: ({ context, args }) => {
          const values = args[0].isArray() ? args[0].asArray() : args[0].asMapStackItem().valuesArray();

          const newValues = values.map((value) => (value instanceof StructStackItem ? value.clone() : value));

          return { context, results: [new ArrayStackItem(newValues)] };
        },
      }),
    ],
    [0xe0, functionCallIsolated({ name: 'CALL_I' })],
    [0xe1, callIsolated({ name: 'CALL_E' })],
    [0xe2, callIsolated({ name: 'CALL_ED', dynamicCall: true })],
    [0xe3, callIsolated({ name: 'CALL_ET', tailCall: true })],
    [0xe4, callIsolated({ name: 'CALL_EDT', tailCall: true, dynamicCall: true })],
    [
      0xf0,
      createOp({
        name: 'THROW',
        invoke: ({ context }) => {
          throw new ThrowError(context);
        },
      }),
    ],
    [
      0xf1,
      createOp({
        name: 'THROWIFNOT',
        in: 1,
        invoke: ({ context, args }) => {
          if (!args[0].asBoolean()) {
            throw new ThrowError(context);
          }

          return { context };
        },
      }),
    ],
  ]);

export const OPCODES = _.fromPairs(OPCODE_PAIRS) as { readonly [Byte in number]?: OpObject };
const STATIC_OPCODES = _.fromPairs(OPCODE_PAIRS.filter((value): value is [number, OpStatic] => value[1].type === 'op'));
const CREATE_OPCODES = _.fromPairs(
  OPCODE_PAIRS.filter((value): value is [number, OpCreate] => value[1].type === 'create'),
);

export const lookupOp = ({ context }: { readonly context: ExecutionContext }) => {
  const opCode = context.code[context.pc];
  const op = STATIC_OPCODES[opCode] as OpStatic | undefined;
  const newContext = {
    ...context,
    pc: context.pc + 1,
  };
  if (op !== undefined) {
    return { op: op.op, context: newContext };
  }

  const create = CREATE_OPCODES[opCode] as OpCreate | undefined;
  if (create === undefined) {
    throw new UnknownOpError(context, `${opCode}`);
  }

  return create.create({ context: newContext });
};
