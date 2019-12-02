import { OpCode, utils, VMState } from '@neo-one/client-common';
// tslint:disable-next-line:match-default-export-name
import bitwise from 'bitwise';
import { BN } from 'bn.js';
import _ from 'lodash';
import {
  ExecutionContext,
  FEES,
  MAX_ARRAY_SIZE,
  MAX_ITEM_SIZE,
  MAX_SHL_SHR,
  MIN_SHL_SHR,
  Op,
  OpInvoke,
} from './constants';
import {
  CodeOverflowError,
  ContainerTooLargeError,
  InvalidHasKeyIndexError,
  InvalidPackCountError,
  InvalidPickItemKeyError,
  InvalidRemoveIndexError,
  InvalidSetItemIndexError,
  ItemTooLargeError,
  LeftNegativeError,
  PickNegativeError,
  RightLengthError,
  RightNegativeError,
  RollNegativeError,
  ShiftTooLargeError,
  StackUnderflowError,
  SubstrNegativeEndError,
  SubstrNegativeStartError,
  ThrowError,
  UnknownOpError,
  XDropNegativeError,
  XDropUnderflowError,
  XSwapNegativeError,
  XTuckNegativeError,
} from './errors';
import {
  ArrayStackItem,
  BooleanStackItem,
  BufferStackItem,
  IntegerStackItem,
  MapStackItem,
  NullStackItem,
  StackItem,
  StructStackItem,
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
  fee,
  in: _in = 0,
  inAlt = 0,
  out = 0,
  outAlt = 0,
  invocation = 0,
  invoke,
}: {
  readonly name: OpCode;
  readonly fee: BN;
  readonly in?: number;
  readonly inAlt?: number;
  readonly out?: number;
  readonly outAlt?: number;
  readonly invocation?: number;
  readonly array?: number;
  readonly item?: number;
  readonly invoke: OpInvoke;
}): OpStatic => ({
  type: 'op',
  op: {
    name,
    in: _in,
    inAlt,
    out,
    outAlt,
    invocation,
    fee,
    invoke,
  },
});

const pushNumber = ({ name, value }: { readonly name: OpCode; readonly value: number }) =>
  createOp({
    name,
    fee: FEES[30],
    out: 1,
    invoke: ({ context }) => ({
      context,
      results: [new IntegerStackItem(new BN(value))],
    }),
  });

const pushData = ({ name, numBytes, fee }: { readonly name: OpCode; readonly numBytes: 1 | 2 | 4; readonly fee: BN }) =>
  createOp({
    name,
    fee,
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

      const value = code.slice(pc + numBytes, pc + numBytes + size);
      if (value.length > MAX_ITEM_SIZE) {
        throw new ItemTooLargeError(context);
      }

      return {
        context: {
          ...context,
          pc: pc + numBytes + size,
        },

        results: [new BufferStackItem(value)],
      };
    },
  });

const jump = ({ name, checkTrue }: { readonly name: OpCode; readonly checkTrue?: boolean }) =>
  createOp({
    name,
    fee: FEES[70],
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

const newArrayOrStruct = ({ name }: { readonly name: 'NEWARRAY' | 'NEWSTRUCT' }) =>
  createOp({
    name,
    fee: FEES[15_000],
    in: 1,
    out: 1,
    invoke: ({ context, args }) => {
      let results;
      if (args[0].isArray()) {
        const array = args[0].asArray();
        results = name === 'NEWARRAY' ? [new ArrayStackItem(array)] : [new StructStackItem(array)];
      } else {
        const count = vmUtils.toNumber(context, args[0].asBigIntegerUnsafe());

        if (count > MAX_ARRAY_SIZE) {
          throw new ContainerTooLargeError(context);
        }

        const fill = _.range(0, count).map(() => new BooleanStackItem(false));
        results = name === 'NEWARRAY' ? [new ArrayStackItem(fill)] : [new StructStackItem(fill)];
      }

      return { context, results };
    },
  });

const JMP = jump({ name: 'JMP' });

const OPCODE_PAIRS = ([
  [
    0x00,
    createOp({
      name: 'PUSH0',
      fee: FEES[30],
      out: 1,
      invoke: ({ context }) => ({
        context,
        results: [new BufferStackItem(Buffer.alloc(0, 0))],
      }),
    }),
  ],
  // tslint:disable-next-line: readonly-array
] as ReadonlyArray<[number, OpObject]>)
  .concat(
    // tslint:disable-next-line: readonly-array
    _.range(0x01, 0x4c).map<[number, OpObject]>((idx) => [
      idx,
      createOp({
        // tslint:disable-next-line no-any
        name: `PUSHBYTES${idx}` as any,
        fee: FEES[120],
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
    [0x4c, pushData({ name: 'PUSHDATA1', numBytes: 1, fee: FEES[180] })],
    [0x4d, pushData({ name: 'PUSHDATA2', numBytes: 2, fee: FEES[13_000] })],
    [0x4e, pushData({ name: 'PUSHDATA4', numBytes: 4, fee: FEES[110_000] })],
    [0x4f, pushNumber({ name: 'PUSHM1', value: -1 })],
  ])
  .concat(
    // tslint:disable-next-line: readonly-array
    _.range(0x51, 0x61).map<[number, OpObject]>((idx) => {
      const value = idx - 0x50;

      // tslint:disable-next-line no-any
      return [idx, pushNumber({ name: `PUSH${value}` as any, value })];
    }),
  )
  .concat([
    [
      0x50,
      createOp({
        name: 'PUSHNULL',
        fee: FEES[30],
        out: 1,
        invoke: ({ context }) => ({ context, results: [new NullStackItem()] }),
      }),
    ],
    [
      0x61,
      createOp({
        name: 'NOP',
        fee: FEES[30],
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
        fee: FEES[22_000],
        invocation: 1,
        invoke: async ({ context }) => {
          const { pc } = context;
          // High level:
          // Execute JMP in place of current op codes pc using same context
          // Continue running after JMP until done
          // Set current pc to pc + 2
          const { op } = JMP;
          const { context: startContext } = await op.invoke({
            context: {
              ...context,
              callingScriptHash: context.scriptHash,
            },
            args: [],
            argsAlt: [],
          });

          const resultContext = await context.engine.run({
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
        fee: FEES[40],
        invoke: ({ context }) => ({
          context: { ...context, state: VMState.Halt },
        }),
      }),
    ],
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
              invocation: sysCall.invocation,
              fee: sysCall.fee,
              invoke: sysCall.invoke,
            },
            context: sysCall.context,
          };
        },
      },
    ],
    [
      0x6e,
      createOp({
        name: 'DUPFROMALTSTACKBOTTOM',
        fee: FEES[60],
        out: 1,
        invoke: ({ context }) => ({
          context,
          results: [context.stackAlt[context.stackAlt.length - 1]],
        }),
      }),
    ],
    [
      0x6a,
      createOp({
        name: 'DUPFROMALTSTACK',
        fee: FEES[60],
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
        fee: FEES[60],
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
        fee: FEES[60],
        inAlt: 1,
        out: 1,
        invoke: ({ context, argsAlt }) => ({
          context,
          results: [argsAlt[0]],
        }),
      }),
    ],
    [
      0x70,
      createOp({
        name: 'ISNULL',
        fee: FEES[60],
        in: 1,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(args[0].isNull())],
        }),
      }),
    ],
    [
      0x6d,
      createOp({
        name: 'XDROP',
        fee: FEES[400],
        in: 1,
        invoke: ({ context, args }) => {
          const n = vmUtils.toNumber(context, args[0].asBigIntegerUnsafe());
          if (n < 0) {
            throw new XDropNegativeError(context);
          }

          const { stack } = context;

          if (n >= stack.length) {
            throw new XDropUnderflowError(context);
          }

          return {
            context: {
              ...context,
              stack: stack.slice(0, n).concat(stack.slice(n + 1)),
              stackCount: context.stackCount + stack[n].decrement(),
            },
          };
        },
      }),
    ],
    [
      0x72,
      createOp({
        name: 'XSWAP',
        fee: FEES[60],
        in: 1,
        invoke: ({ context, args }) => {
          const n = vmUtils.toNumber(context, args[0].asBigIntegerUnsafe());
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
        fee: FEES[400],
        in: 1,
        invoke: ({ context, args }) => {
          const n = vmUtils.toNumber(context, args[0].asBigIntegerUnsafe());
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
              stackCount: context.stackCount + stack[0].increment(),
            },
          };
        },
      }),
    ],
    [
      0x74,
      createOp({
        name: 'DEPTH',
        fee: FEES[60],
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
        fee: FEES[60],
        in: 1,
        invoke: ({ context }) => ({ context }),
      }),
    ],
    [
      0x76,
      createOp({
        name: 'DUP',
        fee: FEES[60],
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
        fee: FEES[60],
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
        fee: FEES[60],
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
        fee: FEES[60],
        in: 1,
        out: 1,
        invoke: ({ context, args }) => {
          const n = vmUtils.toNumber(context, args[0].asBigIntegerUnsafe());
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
        fee: FEES[400],
        in: 1,
        out: 1,
        invoke: ({ context, args }) => {
          const n = vmUtils.toNumber(context, args[0].asBigIntegerUnsafe());
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
              stackCount: context.stackCount + stack[n].decrement(),
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
        fee: FEES[60],
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
        fee: FEES[60],
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
        fee: FEES[60],
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
        fee: FEES[80_000],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => {
          const result = Buffer.concat([args[1].asBuffer(), args[0].asBuffer()]);
          if (result.length > MAX_ITEM_SIZE) {
            throw new ItemTooLargeError(context);
          }

          return {
            context,
            results: [new BufferStackItem(result)],
          };
        },
      }),
    ],
    [
      0x7f,
      createOp({
        name: 'SUBSTR',
        fee: FEES[80_000],
        in: 3,
        out: 1,
        invoke: ({ context, args }) => {
          const end = vmUtils.toNumber(context, args[0].asBigIntegerUnsafe());
          if (end < 0) {
            throw new SubstrNegativeEndError(context);
          }

          const start = vmUtils.toNumber(context, args[1].asBigIntegerUnsafe());
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
        fee: FEES[80_000],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => {
          const count = vmUtils.toNumber(context, args[0].asBigIntegerUnsafe());
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
        fee: FEES[80_000],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => {
          const count = vmUtils.toNumber(context, args[0].asBigIntegerUnsafe());
          if (count < 0) {
            throw new RightNegativeError(context);
          }

          const value = args[1].asBuffer();
          if (value.length < count) {
            throw new RightLengthError(context);
          }

          return {
            context,
            results: [new BufferStackItem(value.slice(value.length - count, value.length))],
          };
        },
      }),
    ],
    [
      0x82,
      createOp({
        name: 'SIZE',
        fee: FEES[60],
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
        fee: FEES[100],
        in: 1,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [
            new IntegerStackItem(
              utils.fromSignedBuffer(bitwise.buffer.not(utils.toSignedBuffer(args[0].asBigIntegerUnsafe()))),
            ),
          ],
        }),
      }),
    ],
    [
      0x84,
      createOp({
        name: 'AND',
        fee: FEES[200],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [
            new IntegerStackItem(
              vmUtils.bitwiseOp(bitwise.buffer.and, args[0].asBigIntegerUnsafe(), args[1].asBigIntegerUnsafe()),
            ),
          ],
        }),
      }),
    ],
    [
      0x85,
      createOp({
        name: 'OR',
        fee: FEES[200],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [
            new IntegerStackItem(
              vmUtils.bitwiseOp(bitwise.buffer.or, args[0].asBigIntegerUnsafe(), args[1].asBigIntegerUnsafe()),
            ),
          ],
        }),
      }),
    ],
    [
      0x86,
      createOp({
        name: 'XOR',
        fee: FEES[200],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [
            new IntegerStackItem(
              vmUtils.bitwiseOp(bitwise.buffer.xor, args[0].asBigIntegerUnsafe(), args[1].asBigIntegerUnsafe()),
            ),
          ],
        }),
      }),
    ],
    [
      0x87,
      createOp({
        name: 'EQUAL',
        fee: FEES[200],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(args[0].equals(args[1]))],
        }),
      }),
    ],
    [
      0x8b,
      createOp({
        name: 'INC',
        fee: FEES[100],
        in: 1,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(args[0].asBigInteger(context.blockchain.currentBlockIndex).add(utils.ONE))],
        }),
      }),
    ],
    [
      0x8c,
      createOp({
        name: 'DEC',
        fee: FEES[100],
        in: 1,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(args[0].asBigInteger(context.blockchain.currentBlockIndex).sub(utils.ONE))],
        }),
      }),
    ],
    [
      0x8d,
      createOp({
        name: 'SIGN',
        fee: FEES[100],
        in: 1,
        out: 1,
        invoke: ({ context, args }) => {
          const value = args[0].asBigIntegerUnsafe();
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
        fee: FEES[100],
        in: 1,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(args[0].asBigIntegerUnsafe().neg())],
        }),
      }),
    ],
    [
      0x90,
      createOp({
        name: 'ABS',
        fee: FEES[100],
        in: 1,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(args[0].asBigIntegerUnsafe().abs())],
        }),
      }),
    ],
    [
      0x91,
      createOp({
        name: 'NOT',
        fee: FEES[100],
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
        fee: FEES[100],
        in: 1,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(!args[0].asBigIntegerUnsafe().isZero())],
        }),
      }),
    ],
    [
      0x93,
      createOp({
        name: 'ADD',
        fee: FEES[200],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [
            new IntegerStackItem(
              args[1]
                .asBigInteger(context.blockchain.currentBlockIndex)
                .add(args[0].asBigInteger(context.blockchain.currentBlockIndex)),
            ),
          ],
        }),
      }),
    ],
    [
      0x94,
      createOp({
        name: 'SUB',
        fee: FEES[200],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [
            new IntegerStackItem(
              args[1]
                .asBigInteger(context.blockchain.currentBlockIndex)
                .sub(args[0].asBigInteger(context.blockchain.currentBlockIndex)),
            ),
          ],
        }),
      }),
    ],
    [
      0x95,
      createOp({
        name: 'MUL',
        fee: FEES[300],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [
            new IntegerStackItem(
              args[1]
                .asBigInteger(context.blockchain.currentBlockIndex)
                .mul(args[0].asBigInteger(context.blockchain.currentBlockIndex)),
            ),
          ],
        }),
      }),
    ],
    [
      0x96,
      createOp({
        name: 'DIV',
        fee: FEES[300],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [
            new IntegerStackItem(
              args[1]
                .asBigInteger(context.blockchain.currentBlockIndex)
                .div(args[0].asBigInteger(context.blockchain.currentBlockIndex)),
            ),
          ],
        }),
      }),
    ],
    [
      0x97,
      createOp({
        name: 'MOD',
        fee: FEES[300],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [
            new IntegerStackItem(
              args[1]
                .asBigInteger(context.blockchain.currentBlockIndex)
                .mod(args[0].asBigInteger(context.blockchain.currentBlockIndex)),
            ),
          ],
        }),
      }),
    ],
    [
      0x98,
      createOp({
        name: 'SHL',
        fee: FEES[300],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => {
          const shift = args[0].asBigIntegerUnsafe();
          if (shift.toNumber() > MAX_SHL_SHR || shift.toNumber() < MIN_SHL_SHR) {
            throw new ShiftTooLargeError(context);
          }

          const value = args[1].asBigIntegerUnsafe();
          const result = new IntegerStackItem(vmUtils.shiftLeft(value, shift));

          return {
            context,
            results: [result],
          };
        },
      }),
    ],
    [
      0x99,
      createOp({
        name: 'SHR',
        fee: FEES[300],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => {
          const shift = args[0].asBigIntegerUnsafe();
          if (shift.toNumber() > MAX_SHL_SHR || shift.toNumber() < MIN_SHL_SHR) {
            throw new ShiftTooLargeError(context);
          }

          const value = args[1].asBigIntegerUnsafe();
          const result = new IntegerStackItem(vmUtils.shiftRight(value, shift));

          return {
            context,
            results: [result],
          };
        },
      }),
    ],
    [
      0x9a,
      createOp({
        name: 'BOOLAND',
        fee: FEES[200],
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
        fee: FEES[200],
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
        fee: FEES[200],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(args[0].asBigIntegerUnsafe().eq(args[1].asBigIntegerUnsafe()))],
        }),
      }),
    ],
    [
      0x9e,
      createOp({
        name: 'NUMNOTEQUAL',
        fee: FEES[200],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(!args[0].asBigIntegerUnsafe().eq(args[1].asBigIntegerUnsafe()))],
        }),
      }),
    ],
    [
      0x9f,
      createOp({
        name: 'LT',
        fee: FEES[200],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(args[1].asBigIntegerUnsafe().lt(args[0].asBigIntegerUnsafe()))],
        }),
      }),
    ],
    [
      0xa0,
      createOp({
        name: 'GT',
        fee: FEES[200],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(args[1].asBigIntegerUnsafe().gt(args[0].asBigIntegerUnsafe()))],
        }),
      }),
    ],
    [
      0xa1,
      createOp({
        name: 'LTE',
        fee: FEES[200],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(args[1].asBigIntegerUnsafe().lte(args[0].asBigIntegerUnsafe()))],
        }),
      }),
    ],
    [
      0xa2,
      createOp({
        name: 'GTE',
        fee: FEES[200],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new BooleanStackItem(args[1].asBigIntegerUnsafe().gte(args[0].asBigIntegerUnsafe()))],
        }),
      }),
    ],
    [
      0xa3,
      createOp({
        name: 'MIN',
        fee: FEES[200],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(BN.min(args[1].asBigIntegerUnsafe(), args[0].asBigIntegerUnsafe()))],
        }),
      }),
    ],
    [
      0xa4,
      createOp({
        name: 'MAX',
        fee: FEES[200],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [new IntegerStackItem(BN.max(args[1].asBigIntegerUnsafe(), args[0].asBigIntegerUnsafe()))],
        }),
      }),
    ],
    [
      0xa5,
      createOp({
        name: 'WITHIN',
        fee: FEES[200],
        in: 3,
        out: 1,
        invoke: ({ context, args }) => ({
          context,
          results: [
            new BooleanStackItem(
              args[1].asBigIntegerUnsafe().lte(args[2].asBigIntegerUnsafe()) &&
                args[2].asBigIntegerUnsafe().lt(args[0].asBigIntegerUnsafe()),
            ),
          ],
        }),
      }),
    ],
    [
      0xc0,
      createOp({
        name: 'ARRAYSIZE',
        fee: FEES[150],
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
            _in = vmUtils.toNumber(contextIn, top.asBigIntegerUnsafe()) + 1;

            if (_in < 0) {
              throw new InvalidPackCountError(contextIn);
            }

            if (_in > MAX_ARRAY_SIZE) {
              throw new ContainerTooLargeError(contextIn);
            }
          }

          const { op } = createOp({
            name: 'PACK',
            fee: FEES[7_000],
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
            fee: FEES[7_000],
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
        fee: FEES[270_000],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => {
          if (args[1].isArray()) {
            const index = vmUtils.toNumber(context, args[0].asBigIntegerUnsafe());
            const val = args[1].asArray();
            if (index < 0 || index >= val.length) {
              throw new InvalidPickItemKeyError(context, `${index}`, JSON.stringify(args[1].convertJSON()));
            }

            const arrayValue = val[index];

            return {
              context,
              results: [arrayValue],
            };
          }

          const key = args[0];
          const value = args[1].asMapStackItem();
          if (!value.has(key)) {
            throw new InvalidPickItemKeyError(context, key.toStructuralKey(), JSON.stringify(args[1].convertJSON()));
          }

          const mapValue = value.get(key);

          return {
            context,
            results: [mapValue],
          };
        },
      }),
    ],
    [
      0xc4,
      createOp({
        name: 'SETITEM',
        fee: FEES[270_000],
        in: 3,
        invoke: ({ context, args }) => {
          let newItem = args[0];
          if (newItem instanceof StructStackItem) {
            newItem = newItem.clone();
          }
          if (args[2].isArray()) {
            const index = vmUtils.toNumber(context, args[1].asBigIntegerUnsafe());
            const mutableValue = args[2].asArray();
            if (index < 0 || index >= mutableValue.length) {
              throw new InvalidSetItemIndexError(context);
            }

            const existing = mutableValue[index];
            mutableValue[index] = newItem;
            const innerSeen = new Set([args[2]]);

            return {
              context: {
                ...context,
                stackCount:
                  context.stackCount +
                  (args[2].referenceCount > 0 ? existing.decrement(innerSeen) + newItem.increment(innerSeen) : 0),
              },
            };
          }

          const key = args[1];
          const value = args[2].asMapStackItem();
          const existingValue = value.has(key) ? value.get(key) : undefined;
          value.set(key, newItem);

          if (value.size > MAX_ARRAY_SIZE) {
            throw new ContainerTooLargeError(context);
          }
          const seen = new Set([args[2]]);

          return {
            context: {
              ...context,
              stackCount:
                context.stackCount +
                (args[2].referenceCount > 0
                  ? (existingValue === undefined ? key.increment(seen) : existingValue.decrement()) +
                    newItem.increment(seen)
                  : 0),
            },
          };
        },
      }),
    ],
    [0xc5, newArrayOrStruct({ name: 'NEWARRAY' })],
    [0xc6, newArrayOrStruct({ name: 'NEWSTRUCT' })],
    [
      0xc7,
      createOp({
        name: 'NEWMAP',
        fee: FEES[200],
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
        fee: FEES[15_000],
        in: 2,
        invoke: ({ context, args }) => {
          let newItem = args[0];
          if (newItem instanceof StructStackItem) {
            newItem = newItem.clone();
          }
          const mutableValue = args[1].asArray();
          mutableValue.push(newItem);

          if (mutableValue.length > MAX_ARRAY_SIZE) {
            throw new ContainerTooLargeError(context);
          }

          return {
            context: {
              ...context,
              stackCount: context.stackCount + (args[1].referenceCount > 0 ? newItem.increment(new Set([args[1]])) : 0),
            },
          };
        },
      }),
    ],
    [
      0xc9,
      createOp({
        name: 'REVERSE',
        fee: FEES[500],
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
        fee: FEES[500],
        in: 2,
        invoke: ({ context, args }) => {
          if (args[1].isArray()) {
            const index = vmUtils.toNumber(context, args[0].asBigIntegerUnsafe());
            const mutableValue = args[1].asArray();
            if (index < 0 || index >= mutableValue.length) {
              throw new InvalidRemoveIndexError(context, index);
            }
            const existing = mutableValue[index];
            mutableValue.splice(index, 1);

            return {
              context: {
                ...context,
                stackCount:
                  context.stackCount + (existing.referenceCount > 0 ? existing.decrement(new Set([args[1]])) : 0),
              },
            };
          }

          const key = args[0];
          const value = args[1].asMapStackItem();
          if (value.has(key)) {
            const val = value.get(key);
            value.delete(key);

            const seen = new Set([args[1]]);

            return {
              context: {
                ...context,
                stackCount:
                  context.stackCount +
                  (key.referenceCount > 0 ? key.decrement(seen) : 0) +
                  (val.referenceCount > 0 ? val.decrement(seen) : 0),
              },
            };
          }

          return { context };
        },
      }),
    ],
    [
      0xcb,
      createOp({
        name: 'HASKEY',
        fee: FEES[270_000],
        in: 2,
        out: 1,
        invoke: ({ context, args }) => {
          if (args[1].isArray()) {
            const index = vmUtils.toNumber(context, args[0].asBigIntegerUnsafe());
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
        fee: FEES[500],
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
        fee: FEES[7_000],
        in: 1,
        out: 1,
        invoke: ({ context, args }) => {
          const values = args[0].isArray() ? args[0].asArray() : args[0].asMapStackItem().valuesArray();

          const newValues = values.map((value) => (value instanceof StructStackItem ? value.clone() : value));

          return { context, results: [new ArrayStackItem(newValues)] };
        },
      }),
    ],
    [
      0xf0,
      createOp({
        name: 'THROW',
        fee: FEES[30],
        invoke: ({ context }) => {
          throw new ThrowError(context);
        },
      }),
    ],
    [
      0xf1,
      createOp({
        name: 'THROWIFNOT',
        fee: FEES[30],
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
// tslint:disable-next-line: readonly-array
const STATIC_OPCODES = _.fromPairs(OPCODE_PAIRS.filter((value): value is [number, OpStatic] => value[1].type === 'op'));
const CREATE_OPCODES = _.fromPairs(
  // tslint:disable-next-line: readonly-array
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
