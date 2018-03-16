/* @flow */
import BN from 'bn.js';
import {
  OPCODE_TO_BYTECODE,
  VM_STATE,
  type OpCode,
  type UInt160,
  common,
  crypto,
  utils,
} from '@neo-one/client-core';

import _ from 'lodash';
import bitwise from 'bitwise';

import {
  ArrayStackItem,
  BooleanStackItem,
  BufferStackItem,
  IntegerStackItem,
  MapStackItem,
  StructStackItem,
  UInt160StackItem,
  UInt256StackItem,
} from './stackItem';
import {
  FEES,
  type ExecutionContext,
  type Op,
  type OpInvoke,
  type OpInvokeArgs,
} from './constants';
import {
  CodeOverflowError,
  ContractNoDynamicInvokeError,
  InvalidCheckMultisigArgumentsError,
  InvalidHasKeyIndexError,
  InvalidPackCountError,
  InvalidPickItemKeyError,
  InvalidRemoveIndexError,
  InvalidSetItemIndexError,
  LeftNegativeError,
  PickNegativeError,
  RightLengthError,
  RightNegativeError,
  RollNegativeError,
  PushOnlyError,
  SubstrNegativeEndError,
  SubstrNegativeStartError,
  ThrowError,
  UnknownOpError,
  XDropNegativeError,
  XSwapNegativeError,
  XTuckNegativeError,
} from './errors';

import { lookupSysCall } from './syscalls';
import vmUtils from './vmUtils';

export type CreateOpArgs = {| context: ExecutionContext |};
export type CreateOp = (input: CreateOpArgs) => Op;
export const createOp = ({
  name,
  in: in_,
  inAlt,
  out,
  outAlt,
  modify,
  modifyAlt,
  invocation,
  array,
  item,
  fee: feeIn,
  invoke,
}: {|
  name: OpCode,
  in?: number,
  inAlt?: number,
  out?: number,
  outAlt?: number,
  modify?: number,
  modifyAlt?: number,
  invocation?: number,
  array?: number,
  item?: number,
  fee?: BN,
  invoke: OpInvoke,
|}): CreateOp => ({ context }) => {
  let fee = feeIn;
  if (fee == null) {
    const byteCode = OPCODE_TO_BYTECODE[name];
    if (
      byteCode <= OPCODE_TO_BYTECODE.PUSH16 ||
      byteCode === OPCODE_TO_BYTECODE.NOP
    ) {
      fee = utils.ZERO;
    } else {
      fee = FEES.ONE;
    }
  }
  return {
    name,
    in: in_ || 0,
    inAlt: inAlt || 0,
    out: out || 0,
    outAlt: outAlt || 0,
    modify: modify || 0,
    modifyAlt: modifyAlt || 0,
    invocation: invocation || 0,
    array: array || 0,
    item: item || 0,
    fee,
    invoke,
    context,
  };
};

const pushNumber = ({ name, value }: {| name: OpCode, value: number |}) =>
  createOp({
    name,
    out: 1,
    invoke: ({ context }: OpInvokeArgs) => ({
      context,
      results: [new IntegerStackItem(new BN(value))],
    }),
  });

const pushData = ({
  name,
  numBytes,
}: {|
  name: OpCode,
  numBytes: 1 | 2 | 4,
|}) =>
  createOp({
    name,
    out: 1,
    invoke: ({ context }: OpInvokeArgs) => {
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
        results: [
          new BufferStackItem(code.slice(pc + numBytes, pc + numBytes + size)),
        ],
      };
    },
  });

const jump = ({ name, checkTrue }: {| name: OpCode, checkTrue?: boolean |}) =>
  createOp({
    name,
    in: checkTrue == null ? 0 : 1,
    invoke: ({ context, args }: OpInvokeArgs) => {
      const { code } = context;
      let { pc } = context;
      const offset = code.readInt16LE(pc);
      pc += 2;
      const newPC = pc + offset - 3;
      if (newPC < 0 || newPC > code.length) {
        throw new CodeOverflowError(context);
      }

      let shouldJump = true;
      if (checkTrue != null) {
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

const isDynamic = (hash: UInt160) =>
  common.uInt160ToBuffer(hash).every(value => value === 0);

const call = ({ name, tailCall }: {| name: OpCode, tailCall?: boolean |}) => ({
  context: contextIn,
}: CreateOpArgs) => {
  const hashIn = common.bufferToUInt160(
    contextIn.code.slice(contextIn.pc, contextIn.pc + 20),
  );
  return createOp({
    name,
    in: isDynamic(hashIn) ? 1 : 0,
    invocation: tailCall ? 0 : 1,
    fee: FEES.TEN,
    invoke: async ({ monitor, context, args }: OpInvokeArgs) => {
      const { pc, scriptHash } = context;
      let hash = common.bufferToUInt160(context.code.slice(pc, pc + 20));
      if (isDynamic(hash)) {
        hash = common.bufferToUInt160(args[0].asBuffer());

        const executingContract = await context.blockchain.contract.get({
          hash: scriptHash,
        });

        if (!executingContract.hasDynamicInvoke) {
          throw new ContractNoDynamicInvokeError(
            context,
            common.uInt160ToString(hash),
          );
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
          actionIndex: context.actionIndex,
          createdContracts: context.createdContracts,
          scriptHash: context.scriptHash,
          entryScriptHash: context.entryScriptHash,
        },
      });

      let { state } = resultContext;
      if (state === VM_STATE.HALT) {
        // If it's a tail call, then the final recursive call executes the rest
        // of the script, and we just return immediately here.
        state = tailCall ? VM_STATE.HALT : context.state;
      }
      return {
        context: {
          ...resultContext,
          code: context.code,
          pc: pc + 20,
          state,
          depth: context.depth,
        },
      };
    },
  })({ context: contextIn });
};

const JMP = jump({ name: 'JMP' });

const OPCODE_PAIRS = [
  [
    0x00,
    createOp({
      name: 'PUSH0',
      out: 1,
      invoke: ({ context }: OpInvokeArgs) => ({
        context,
        results: [new BufferStackItem(Buffer.alloc(0, 0))],
      }),
    }),
  ],
]
  .concat(
    _.range(0x01, 0x4c).map(idx => [
      idx,
      createOp({
        name: (`PUSHBYTES${idx}`: $FlowFixMe),
        out: 1,
        invoke: ({ context }: OpInvokeArgs) => ({
          context: {
            ...context,
            pc: context.pc + idx,
          },
          results: [
            new BufferStackItem(
              context.code.slice(context.pc, context.pc + idx),
            ),
          ],
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
    _.range(0x51, 0x61).map(idx => {
      const value = idx - 0x50;
      return [idx, pushNumber({ name: (`PUSH${value}`: $FlowFixMe), value })];
    }),
  )
  .concat([
    [
      0x61,
      createOp({
        name: 'NOP',
        invoke: ({ context }: OpInvokeArgs) => ({ context }),
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
        invoke: async ({ monitor, context }: OpInvokeArgs) => {
          const { pc } = context;
          // High level:
          // Execute JMP in place of current op codes pc using same context
          // Continue running after JMP until done
          // Set current pc to pc + 2
          const op = JMP({ context });
          const { context: startContext } = await op.invoke({
            monitor,
            context: op.context,
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
              pc: pc + 2,
              state:
                resultContext.state === VM_STATE.FAULT
                  ? VM_STATE.FAULT
                  : VM_STATE.NONE,
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
        invoke: ({ context }: OpInvokeArgs) => ({
          context: { ...context, state: VM_STATE.HALT },
        }),
      }),
    ],
    [0x67, call({ name: 'APPCALL' })],
    [
      0x68,
      ({ context }: CreateOpArgs) => {
        const sysCall = lookupSysCall({ context });
        return {
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
          context: sysCall.context,
        };
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
        invoke: ({ context, argsAlt }: OpInvokeArgs) => ({
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
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
        invoke: ({ context, argsAlt }: OpInvokeArgs) => ({
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
        invoke: ({ context, args }: OpInvokeArgs) => {
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
        invoke: ({ context, args }: OpInvokeArgs) => {
          const n = vmUtils.toNumber(context, args[0].asBigInteger());
          if (n < 0) {
            throw new XSwapNegativeError(context);
          }

          const stack = [...context.stack];
          // eslint-disable-next-line
          stack[n] = context.stack[0];
          stack[0] = context.stack[n];

          return { context: { ...context, stack } };
        },
      }),
    ],
    [
      0x73,
      createOp({
        name: 'XTUCK',
        in: 1,
        modify: 1,
        invoke: ({ context, args }: OpInvokeArgs) => {
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
        invoke: ({ context }: OpInvokeArgs) => ({
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
        invoke: ({ context }: OpInvokeArgs) => ({ context }),
      }),
    ],
    [
      0x76,
      createOp({
        name: 'DUP',
        in: 1,
        out: 2,
        invoke: ({ context, args }: OpInvokeArgs) => ({
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
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
        invoke: ({ context, args }: OpInvokeArgs) => {
          const n = vmUtils.toNumber(context, args[0].asBigInteger());
          if (n < 0) {
            throw new PickNegativeError(context);
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
        invoke: ({ context, args }: OpInvokeArgs) => {
          const n = vmUtils.toNumber(context, args[0].asBigInteger());
          if (n < 0) {
            throw new RollNegativeError(context);
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new BufferStackItem(
              Buffer.concat([args[1].asBuffer(), args[0].asBuffer()]),
            ),
          ],
        }),
      }),
    ],
    [
      0x7f,
      createOp({
        name: 'SUBSTR',
        in: 3,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => {
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
            results: [
              new BufferStackItem(args[2].asBuffer().slice(start, start + end)),
            ],
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
        invoke: ({ context, args }: OpInvokeArgs) => {
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
        invoke: ({ context, args }: OpInvokeArgs) => {
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new IntegerStackItem(
              utils.fromSignedBuffer(
                bitwise.buffer.not(
                  utils.toSignedBuffer(args[0].asBigInteger()),
                ),
              ),
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new IntegerStackItem(
              utils.fromSignedBuffer(
                bitwise.buffer.and(
                  utils.toSignedBuffer(args[0].asBigInteger()),
                  utils.toSignedBuffer(args[1].asBigInteger()),
                ),
              ),
            ),
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new IntegerStackItem(
              utils.fromSignedBuffer(
                bitwise.buffer.or(
                  utils.toSignedBuffer(args[0].asBigInteger()),
                  utils.toSignedBuffer(args[1].asBigInteger()),
                ),
              ),
            ),
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new IntegerStackItem(
              utils.fromSignedBuffer(
                bitwise.buffer.xor(
                  utils.toSignedBuffer(args[0].asBigInteger()),
                  utils.toSignedBuffer(args[1].asBigInteger()),
                ),
              ),
            ),
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new IntegerStackItem(args[0].asBigInteger().add(utils.ONE)),
          ],
        }),
      }),
    ],
    [
      0x8c,
      createOp({
        name: 'DEC',
        in: 1,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new IntegerStackItem(args[0].asBigInteger().sub(utils.ONE)),
          ],
        }),
      }),
    ],
    [
      0x8d,
      createOp({
        name: 'SIGN',
        in: 1,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => {
          const value = args[0].asBigInteger();
          const results = [];
          if (value.isZero()) {
            results.push(new IntegerStackItem(utils.ZERO));
          } else if (value.isNeg()) {
            results.push(new IntegerStackItem(utils.NEGATIVE_ONE));
          } else {
            results.push(new IntegerStackItem(utils.ONE));
          }

          return { context, results };
        },
      }),
    ],
    [
      0x8f,
      createOp({
        name: 'NEGATE',
        in: 1,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new IntegerStackItem(
              args[1].asBigInteger().add(args[0].asBigInteger()),
            ),
          ],
        }),
      }),
    ],
    [
      0x94,
      createOp({
        name: 'SUB',
        in: 2,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new IntegerStackItem(
              args[1].asBigInteger().sub(args[0].asBigInteger()),
            ),
          ],
        }),
      }),
    ],
    [
      0x95,
      createOp({
        name: 'MUL',
        in: 2,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new IntegerStackItem(
              args[1].asBigInteger().mul(args[0].asBigInteger()),
            ),
          ],
        }),
      }),
    ],
    [
      0x96,
      createOp({
        name: 'DIV',
        in: 2,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new IntegerStackItem(
              args[1].asBigInteger().div(args[0].asBigInteger()),
            ),
          ],
        }),
      }),
    ],
    [
      0x97,
      createOp({
        name: 'MOD',
        in: 2,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new IntegerStackItem(
              args[1].asBigInteger().mod(args[0].asBigInteger()),
            ),
          ],
        }),
      }),
    ],
    // TODO: We need to check SHL and SHR are correct against the C# VM
    [
      0x98,
      createOp({
        name: 'SHL',
        in: 2,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new IntegerStackItem(
              vmUtils.shiftLeft(args[0].asBigInteger(), args[1].asBigInteger()),
            ),
          ],
        }),
      }),
    ],
    [
      0x99,
      createOp({
        name: 'SHR',
        in: 2,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new IntegerStackItem(
              vmUtils.shiftRight(
                args[0].asBigInteger(),
                args[1].asBigInteger(),
              ),
            ),
          ],
        }),
      }),
    ],
    [
      0x9a,
      createOp({
        name: 'BOOLAND',
        in: 2,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new BooleanStackItem(args[0].asBoolean() && args[1].asBoolean()),
          ],
        }),
      }),
    ],
    [
      0x9b,
      createOp({
        name: 'BOOLOR',
        in: 2,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new BooleanStackItem(args[0].asBoolean() || args[1].asBoolean()),
          ],
        }),
      }),
    ],
    [
      0x9c,
      createOp({
        name: 'NUMEQUAL',
        in: 2,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new BooleanStackItem(
              args[0].asBigInteger().eq(args[1].asBigInteger()),
            ),
          ],
        }),
      }),
    ],
    [
      0x9e,
      createOp({
        name: 'NUMNOTEQUAL',
        in: 2,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new BooleanStackItem(
              !args[0].asBigInteger().eq(args[1].asBigInteger()),
            ),
          ],
        }),
      }),
    ],
    [
      0x9f,
      createOp({
        name: 'LT',
        in: 2,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new BooleanStackItem(
              args[1].asBigInteger().lt(args[0].asBigInteger()),
            ),
          ],
        }),
      }),
    ],
    [
      0xa0,
      createOp({
        name: 'GT',
        in: 2,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new BooleanStackItem(
              args[1].asBigInteger().gt(args[0].asBigInteger()),
            ),
          ],
        }),
      }),
    ],
    [
      0xa1,
      createOp({
        name: 'LTE',
        in: 2,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new BooleanStackItem(
              args[1].asBigInteger().lte(args[0].asBigInteger()),
            ),
          ],
        }),
      }),
    ],
    [
      0xa2,
      createOp({
        name: 'GTE',
        in: 2,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new BooleanStackItem(
              args[1].asBigInteger().gte(args[0].asBigInteger()),
            ),
          ],
        }),
      }),
    ],
    [
      0xa3,
      createOp({
        name: 'MIN',
        in: 2,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new IntegerStackItem(
              BN.min(args[1].asBigInteger(), args[0].asBigInteger()),
            ),
          ],
        }),
      }),
    ],
    [
      0xa4,
      createOp({
        name: 'MAX',
        in: 2,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new IntegerStackItem(
              BN.max(args[1].asBigInteger(), args[0].asBigInteger()),
            ),
          ],
        }),
      }),
    ],
    [
      0xa5,
      createOp({
        name: 'WITHIN',
        in: 3,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new BooleanStackItem(
              args[1].asBigInteger().lte(args[2].asBigInteger()) &&
                args[2].asBigInteger().lt(args[0].asBigInteger()),
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
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
        invoke: async ({ context, args }: OpInvokeArgs) => {
          const publicKey = args[0].asECPoint();
          const signature = args[1].asBuffer();
          let result;
          try {
            result = await crypto.verify({
              message: context.init.scriptContainer.value.message,
              signature,
              publicKey,
            });
          } catch (error) {
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
      ({ context: contextIn }: CreateOpArgs) => {
        const { stack } = contextIn;
        const top = stack[0];
        let pubKeyCount = 0;
        let in_;
        if (top == null || top.isArray()) {
          if (top != null) {
            pubKeyCount = top.asArray().length;
          }
          in_ = 1;
        } else {
          pubKeyCount = vmUtils.toNumber(contextIn, top.asBigInteger());
          if (pubKeyCount <= 0) {
            throw new InvalidCheckMultisigArgumentsError(contextIn);
          }
          in_ = 1 + pubKeyCount;
        }

        const next = stack[in_];
        if (next == null || next.isArray()) {
          in_ += 1;
        } else {
          const sigCount = vmUtils.toNumber(contextIn, next.asBigInteger());
          if (sigCount < 0) {
            throw new InvalidCheckMultisigArgumentsError(contextIn);
          }
          in_ += 1 + sigCount;
        }

        return createOp({
          name: 'CHECKMULTISIG',
          in: in_,
          out: 1,
          fee:
            pubKeyCount === 0
              ? FEES.ONE
              : FEES.ONE_HUNDRED.mul(new BN(pubKeyCount)),
          invoke: ({ context, args }: OpInvokeArgs) => {
            let index;
            let publicKeys;
            if (args[0].isArray()) {
              index = 1;
              publicKeys = args[0].asArray().map(value => value.asECPoint());
            } else {
              const count = vmUtils.toNumber(context, args[0].asBigInteger());
              index = 1 + count;
              publicKeys = args.slice(1, index).map(value => value.asECPoint());
            }

            let signatures;
            if (args[index].isArray()) {
              signatures = args[index].asArray().map(value => value.asBuffer());
            } else {
              signatures = args.slice(index + 1).map(value => value.asBuffer());
            }

            if (
              publicKeys.length === 0 ||
              signatures.length === 0 ||
              signatures.length > publicKeys.length
            ) {
              throw new InvalidCheckMultisigArgumentsError(context);
            }

            let result = true;
            const n = publicKeys.length;
            const m = signatures.length;
            try {
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
            } catch (error) {
              result = false;
            }

            return {
              context,
              results: [new BooleanStackItem(result)],
            };
          },
        })({ context: contextIn });
      },
    ],
    [
      0xc0,
      createOp({
        name: 'ARRAYSIZE',
        in: 1,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [new IntegerStackItem(new BN(args[0].size))],
        }),
      }),
    ],
    [
      0xc1,
      ({ context: contextIn }: CreateOpArgs) => {
        const { stack } = contextIn;
        const top = stack[0];
        let in_;
        if (top == null) {
          // This will cause the op to throw once it's executed.
          in_ = 1;
        } else {
          in_ = 1 + vmUtils.toNumber(contextIn, top.asBigInteger());

          if (in_ < 0) {
            throw new InvalidPackCountError(contextIn);
          }
        }

        return createOp({
          name: 'PACK',
          in: in_,
          out: 1,
          invoke: ({ context, args }: OpInvokeArgs) => ({
            context,
            results: [new ArrayStackItem(args.slice(1))],
          }),
        })({ context: contextIn });
      },
    ],
    [
      0xc2,
      ({ context: contextIn }: CreateOpArgs) => {
        const { stack } = contextIn;
        const top = stack[0];
        let out;
        if (top == null) {
          out = 1;
        } else {
          out = 1 + top.asArray().length;
        }

        return createOp({
          name: 'UNPACK',
          in: 1,
          out,
          invoke: ({ context, args }: OpInvokeArgs) => {
            const arr = args[0].asArray();
            const results = [];
            for (let i = arr.length - 1; i >= 0; i -= 1) {
              results.push(arr[i]);
            }
            results.push(new IntegerStackItem(new BN(arr.length)));

            return { context, results };
          },
        })({ context: contextIn });
      },
    ],
    [
      0xc3,
      createOp({
        name: 'PICKITEM',
        in: 2,
        out: 1,
        invoke: ({ context, args }: OpInvokeArgs) => {
          if (args[1].isArray()) {
            const index = vmUtils.toNumber(context, args[0].asBigInteger());
            const value = args[1].asArray();
            if (index < 0 || index >= value.length) {
              throw new InvalidPickItemKeyError(context);
            }

            return { context, results: [value[index]] };
          }

          const key = args[0];
          const value = args[1].asMapStackItem();
          if (!value.has(key)) {
            throw new InvalidPickItemKeyError(context);
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
        invoke: ({ context, args }: OpInvokeArgs) => {
          let newItem = args[0];
          if (newItem instanceof StructStackItem) {
            newItem = newItem.clone();
          }
          if (args[2].isArray()) {
            const index = vmUtils.toNumber(context, args[1].asBigInteger());
            const value = args[2].asArray();
            if (index < 0 || index >= value.length) {
              throw new InvalidSetItemIndexError(context);
            }

            value[index] = newItem;
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new ArrayStackItem(
              _.range(0, vmUtils.toNumber(context, args[0].asBigInteger())).map(
                () => new BooleanStackItem(false),
              ),
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
        invoke: ({ context, args }: OpInvokeArgs) => ({
          context,
          results: [
            new StructStackItem(
              _.range(0, vmUtils.toNumber(context, args[0].asBigInteger())).map(
                () => new BooleanStackItem(false),
              ),
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
        invoke: ({ context }: OpInvokeArgs) => ({
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
        invoke: ({ context, args }: OpInvokeArgs) => {
          let newItem = args[0];
          if (newItem instanceof StructStackItem) {
            newItem = newItem.clone();
          }
          const value = args[1].asArray();
          value.push(newItem);

          return { context };
        },
      }),
    ],
    [
      0xc9,
      createOp({
        name: 'REVERSE',
        in: 1,
        invoke: ({ context, args }: OpInvokeArgs) => {
          const value = args[0].asArray();
          value.reverse();

          return { context };
        },
      }),
    ],
    [
      0xca,
      createOp({
        name: 'REMOVE',
        in: 2,
        invoke: ({ context, args }: OpInvokeArgs) => {
          if (args[1].isArray()) {
            const index = args[0].asBigInteger().toNumber();
            const value = args[1].asArray();
            if (index < 0 || index >= value.length) {
              throw new InvalidRemoveIndexError(context);
            }
            value.splice(index, 1);

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
        invoke: ({ context, args }: OpInvokeArgs) => {
          if (args[1].isArray()) {
            const index = args[0].asBigInteger().toNumber();
            const value = args[1].asArray();
            if (index < 0) {
              throw new InvalidHasKeyIndexError(context);
            }

            return {
              context,
              results: [new BooleanStackItem(index < value.length)],
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
        invoke: ({ context, args }: OpInvokeArgs) => {
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
        invoke: ({ context, args }: OpInvokeArgs) => {
          const values = args[0].isArray()
            ? args[0].asArray()
            : args[0].asMapStackItem().valuesArray();

          const newValues = [];
          for (const value of values) {
            newValues.push(
              value instanceof StructStackItem ? value.clone() : value,
            );
          }

          return { context, results: [new ArrayStackItem(newValues)] };
        },
      }),
    ],
    [
      0xf0,
      createOp({
        name: 'THROW',
        invoke: ({ context }: OpInvokeArgs) => {
          throw new ThrowError(context);
        },
      }),
    ],
    [
      0xf1,
      createOp({
        name: 'THROWIFNOT',
        in: 1,
        invoke: ({ context, args }: OpInvokeArgs) => {
          if (!args[0].asBoolean()) {
            throw new ThrowError(context);
          }
          return { context };
        },
      }),
    ],
  ]);

export const OPCODES = (_.fromPairs(OPCODE_PAIRS): {
  [byte: number]: CreateOp,
});

export const lookupOp = ({ context }: {| context: ExecutionContext |}) => {
  const opCode = context.code[context.pc];
  const create = OPCODES[opCode];
  if (create == null) {
    throw new UnknownOpError(context, `${opCode}`);
  }

  if (
    opCode > OPCODE_TO_BYTECODE.PUSH16 &&
    opCode !== OPCODE_TO_BYTECODE.RET &&
    context.pushOnly
  ) {
    throw new PushOnlyError(context, opCode);
  }

  return create({
    context: ({
      ...context,
      pc: context.pc + 1,
    }: $FlowFixMe),
  });
};
