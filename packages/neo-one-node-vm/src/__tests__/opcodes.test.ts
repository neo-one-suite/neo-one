// tslint:disable no-object-mutation no-any no-loop-statement
import { BinaryWriter, OpCode, ScriptBuilder, ScriptBuilderParam } from '@neo-one/client-common';
import {
  AttributeUsage,
  NULL_ACTION,
  ScriptContainerType,
  Transaction,
  TriggerType,
  UInt160Attribute,
  utils,
} from '@neo-one/node-core';
import { BN } from 'bn.js';
import _ from 'lodash';
import { keys, transactions } from '../__data__';
import { ExecutionInit, FEES } from '../constants';
import { executeScript } from '../execute';
import {
  ArrayStackItem,
  BooleanStackItem,
  BufferStackItem,
  IntegerStackItem,
  MapStackItem,
  StackItem,
  StructStackItem,
} from '../stackItem';

const triggerType = TriggerType.Application;
const scriptAttributeHash = keys[0].scriptHash;
const blockTime = Date.now();

interface Op {
  readonly op: OpCode;
  readonly buffer?: Buffer;
}

interface TestCase extends Op {
  readonly preOps?: readonly Op[];
  readonly postOps?: readonly Op[];
  readonly result: readonly StackItem[];
  readonly resultAlt?: readonly StackItem[];
  readonly gas: BN;
  readonly args?: ReadonlyArray<ScriptBuilderParam | undefined>;
  readonly argsAlt?: ReadonlyArray<ScriptBuilderParam | undefined>;
  readonly stackItems?: readonly StackItem[];
  readonly ref?: StackItem;
  // tslint:disable-next-line no-any
  readonly mockBlockchain?: (options: { readonly blockchain: any }) => void;
  // tslint:disable-next-line no-any
  readonly mockTransaction?: (options: { readonly transaction: any }) => void;
  readonly returnValueCount?: number;
}

const setRef = new ArrayStackItem([new IntegerStackItem(new BN(1))]);
const appendRef = new ArrayStackItem([]);
const reverseRef = new ArrayStackItem([
  new IntegerStackItem(new BN(1)),
  new IntegerStackItem(new BN(2)),
  new IntegerStackItem(new BN(3)),
]);

const simpleStruct = new StructStackItem([new IntegerStackItem(new BN(1))]);

const removeRef = new ArrayStackItem([new IntegerStackItem(new BN(1)), new IntegerStackItem(new BN(2))]);

const mapStatic = new MapStackItem({
  referenceKeys: new Map([
    [
      new BufferStackItem(Buffer.from('aaaa', 'hex')).toStructuralKey(),
      new BufferStackItem(Buffer.from('aaaa', 'hex')),
    ] as const,
    [
      new BufferStackItem(Buffer.from('bbbb', 'hex')).toStructuralKey(),
      new BufferStackItem(Buffer.from('bbbb', 'hex')),
    ] as const,
  ]),
  referenceValues: new Map([
    [new BufferStackItem(Buffer.from('aaaa', 'hex')).toStructuralKey(), new IntegerStackItem(new BN(1))] as const,
    [new BufferStackItem(Buffer.from('bbbb', 'hex')).toStructuralKey(), new IntegerStackItem(new BN(2))] as const,
  ]),
});

const mapSetRef = new MapStackItem({
  referenceKeys: new Map([
    [
      new BufferStackItem(Buffer.from('aaaa', 'hex')).toStructuralKey(),
      new BufferStackItem(Buffer.from('aaaa', 'hex')),
    ] as const,
    [
      new BufferStackItem(Buffer.from('bbbb', 'hex')).toStructuralKey(),
      new BufferStackItem(Buffer.from('bbbb', 'hex')),
    ] as const,
  ]),
  referenceValues: new Map([
    [new BufferStackItem(Buffer.from('aaaa', 'hex')).toStructuralKey(), new IntegerStackItem(new BN(1))] as const,
    [new BufferStackItem(Buffer.from('bbbb', 'hex')).toStructuralKey(), new IntegerStackItem(new BN(2))] as const,
  ]),
});

const mapRemoveRef = new MapStackItem({
  referenceKeys: new Map([
    [
      new BufferStackItem(Buffer.from('aaaa', 'hex')).toStructuralKey(),
      new BufferStackItem(Buffer.from('aaaa', 'hex')),
    ] as const,
    [
      new BufferStackItem(Buffer.from('bbbb', 'hex')).toStructuralKey(),
      new BufferStackItem(Buffer.from('bbbb', 'hex')),
    ] as const,
  ]),
  referenceValues: new Map([
    [new BufferStackItem(Buffer.from('aaaa', 'hex')).toStructuralKey(), new IntegerStackItem(new BN(1))] as const,
    [new BufferStackItem(Buffer.from('bbbb', 'hex')).toStructuralKey(), new IntegerStackItem(new BN(2))] as const,
  ]),
});

const contractSB = new ScriptBuilder();
contractSB.emitOp('PUSH3');
contractSB.emitOp('PUSH2');

// const hugeBuffer = Buffer.alloc(16843009, 0);

const OPCODES = ([
  {
    op: 'PUSH0',
    result: [new BufferStackItem(Buffer.from([]))],
    gas: FEES[30],
  },
] as readonly TestCase[])
  .concat(
    _.range(0x01, 0x4c).map((idx) => ({
      // tslint:disable-next-line no-any
      op: `PUSHBYTES${idx}` as any,
      buffer: Buffer.alloc(idx, 10),
      result: [new BufferStackItem(Buffer.alloc(idx, 10))],
      gas: FEES[120],
    })),
  )
  .concat(
    [
      {
        op: 'PUSHDATA1',
        buffer: Buffer.from([2, 10, 10]),
        result: [new BufferStackItem(Buffer.alloc(2, 10))],
        gas: FEES[180],
      },

      {
        op: 'PUSHDATA2',
        buffer: Buffer.concat([Buffer.from([1, 1]), Buffer.alloc(257, 10)]),
        result: [new BufferStackItem(Buffer.alloc(257, 10))],
        gas: FEES[13_000],
      },

      // {
      //   op: 'PUSHDATA4',
      //   buffer: Buffer.concat([Buffer.from([1, 1, 1, 1]), hugeBuffer]),
      //   result: [new BufferStackItem(hugeBuffer)],
      //   gas: FEES[110_000],
      // },

      {
        op: 'PUSHM1',
        result: [new IntegerStackItem(new BN(-1))],
        gas: FEES[30],
      },

      {
        op: 'PUSH1',
        result: [new IntegerStackItem(new BN(1))],
        gas: FEES[30],
      },

      {
        op: 'PUSH2',
        result: [new IntegerStackItem(new BN(2))],
        gas: FEES[30],
      },

      {
        op: 'PUSH3',
        result: [new IntegerStackItem(new BN(3))],
        gas: FEES[30],
      },

      {
        op: 'PUSH4',
        result: [new IntegerStackItem(new BN(4))],
        gas: FEES[30],
      },

      {
        op: 'PUSH5',
        result: [new IntegerStackItem(new BN(5))],
        gas: FEES[30],
      },

      {
        op: 'PUSH6',
        result: [new IntegerStackItem(new BN(6))],
        gas: FEES[30],
      },

      {
        op: 'PUSH7',
        result: [new IntegerStackItem(new BN(7))],
        gas: FEES[30],
      },

      {
        op: 'PUSH8',
        result: [new IntegerStackItem(new BN(8))],
        gas: FEES[30],
      },

      {
        op: 'PUSH9',
        result: [new IntegerStackItem(new BN(9))],
        gas: FEES[30],
      },

      {
        op: 'PUSH10',
        result: [new IntegerStackItem(new BN(10))],
        gas: FEES[30],
      },

      {
        op: 'PUSH11',
        result: [new IntegerStackItem(new BN(11))],
        gas: FEES[30],
      },

      {
        op: 'PUSH12',
        result: [new IntegerStackItem(new BN(12))],
        gas: FEES[30],
      },

      {
        op: 'PUSH13',
        result: [new IntegerStackItem(new BN(13))],
        gas: FEES[30],
      },

      {
        op: 'PUSH14',
        result: [new IntegerStackItem(new BN(14))],
        gas: FEES[30],
      },

      {
        op: 'PUSH15',
        result: [new IntegerStackItem(new BN(15))],
        gas: FEES[30],
      },

      {
        op: 'PUSH16',
        result: [new IntegerStackItem(new BN(16))],
        gas: FEES[30],
      },

      {
        op: 'NOP',
        result: [],
        gas: FEES[30],
      },

      {
        op: 'JMP',
        // Jump 1 ahead + 2 over the jump bytes
        buffer: new ScriptBuilder().emitInt16LE(3).build(),
        postOps: [{ op: 'PUSH2' }, { op: 'PUSH3' }],
        result: [new IntegerStackItem(new BN(3)), new IntegerStackItem(new BN(2))],

        gas: FEES[70].add(FEES[30]).add(FEES[30]),
      },

      {
        op: 'JMP',
        // Jump 2 ahead + 2 over the jump bytes
        buffer: new ScriptBuilder().emitInt16LE(4).build(),
        postOps: [{ op: 'PUSH2' }, { op: 'PUSH3' }],
        result: [new IntegerStackItem(new BN(3))],
        gas: FEES[70].add(FEES[30]),
      },

      {
        op: 'JMPIF',
        args: [Buffer.alloc(1, 1)],
        // Jump 2 ahead + 2 over the jump bytes
        buffer: new ScriptBuilder().emitInt16LE(4).build(),
        postOps: [{ op: 'PUSH2' }, { op: 'PUSH3' }],
        result: [new IntegerStackItem(new BN(3))],
        gas: FEES[70].add(FEES[30]),
      },

      {
        op: 'JMPIF',
        args: [Buffer.alloc(1, 0)],
        // Jump 2 ahead + 2 over the jump bytes
        buffer: new ScriptBuilder().emitInt16LE(4).build(),
        postOps: [{ op: 'PUSH2' }, { op: 'PUSH3' }],
        result: [new IntegerStackItem(new BN(3)), new IntegerStackItem(new BN(2))],
        gas: FEES[70].add(FEES[30]).add(FEES[30]),
      },

      {
        op: 'JMPIFNOT',
        args: [Buffer.alloc(1, 0)],
        // Jump 2 ahead + 2 over the jump bytes
        buffer: new ScriptBuilder().emitInt16LE(4).build(),
        postOps: [{ op: 'PUSH2' }, { op: 'PUSH3' }],
        result: [new IntegerStackItem(new BN(3))],
        gas: FEES[70].add(FEES[30]),
      },

      {
        op: 'JMPIFNOT',
        args: [Buffer.alloc(1, 1)],
        // Jump 2 ahead + 2 over the jump bytes
        buffer: new ScriptBuilder().emitInt16LE(4).build(),
        postOps: [{ op: 'PUSH2' }, { op: 'PUSH3' }],
        result: [new IntegerStackItem(new BN(3)), new IntegerStackItem(new BN(2))],
        gas: FEES[70].add(FEES[30]).add(FEES[30]),
      },

      {
        op: 'CALL',
        // Jump 2 ahead + 2 over the jump bytes
        buffer: new ScriptBuilder().emitInt16LE(4).build(),
        // We jump to PUSH3, then return, then invoke PUSH2 and PUSH3 again.
        postOps: [{ op: 'PUSH2' }, { op: 'PUSH3' }, { op: 'RET' }],
        result: [new IntegerStackItem(new BN(3)), new IntegerStackItem(new BN(2)), new IntegerStackItem(new BN(3))],

        // CALL + RET + RET + PUSH3 + PUSH2 + PUSH3
        gas: FEES[22_000]
          .add(FEES[40])
          .add(FEES[40])
          .add(FEES[30])
          .add(FEES[30])
          .add(FEES[30]),
      },

      {
        op: 'CALL',
        // Jump 2 behind
        buffer: new ScriptBuilder().emitInt16LE(-2).build(),
        // We jump to PUSH3, then return, then invoke PUSH2 and PUSH3 again.
        preOps: [
          {
            op: 'JMP',
            // Jump 4 ahead + 2 over the jump bytes
            buffer: new ScriptBuilder().emitInt16LE(6).build(),
          },

          { op: 'PUSH2' },
          { op: 'PUSH3' },
          { op: 'RET' },
        ],

        result: [new IntegerStackItem(new BN(3))],
        // JMP + CALL + RET + PUSH3
        gas: FEES[70]
          .add(FEES[22_000])
          .add(FEES[40])
          .add(FEES[30]),
      },

      {
        op: 'SYSCALL',
        buffer: new BinaryWriter().writeVarBytesLE(Buffer.from('System.Blockchain.GetHeight', 'ascii')).toBuffer(),
        result: [new IntegerStackItem(new BN(10))],
        mockBlockchain: ({ blockchain }) => {
          blockchain.currentBlock.index = 10;
        },
        gas: FEES[400],
      },

      {
        op: 'DUPFROMALTSTACKBOTTOM',
        argsAlt: [new BN(2), new BN(3)],
        result: [new IntegerStackItem(new BN(3))],
        gas: FEES[60],
      },

      {
        op: 'DUPFROMALTSTACK',
        argsAlt: [new BN(1)],
        result: [new IntegerStackItem(new BN(1))],
        resultAlt: [new IntegerStackItem(new BN(1))],
        gas: FEES[60],
      },

      {
        op: 'TOALTSTACK',
        args: [new BN(1)],
        result: [],
        resultAlt: [new IntegerStackItem(new BN(1))],
        gas: FEES[60],
      },

      {
        op: 'FROMALTSTACK',
        argsAlt: [new BN(1)],
        result: [new IntegerStackItem(new BN(1))],
        gas: FEES[60],
      },

      {
        op: 'XDROP',
        args: [new BN(1), Buffer.alloc(1, 1), Buffer.alloc(1, 0)],
        result: [new BufferStackItem(Buffer.alloc(1, 1))],
        gas: FEES[400],
      },

      {
        op: 'XSWAP',
        args: [new BN(1), Buffer.alloc(1, 1), Buffer.alloc(1, 0)],
        result: [new BufferStackItem(Buffer.alloc(1, 0)), new BufferStackItem(Buffer.alloc(1, 1))],

        gas: FEES[60],
      },

      {
        op: 'XTUCK',
        args: [new BN(2), Buffer.alloc(1, 0), Buffer.alloc(1, 1), Buffer.alloc(1, 2), Buffer.alloc(1, 3)],

        result: [
          new BufferStackItem(Buffer.alloc(1, 0)),
          new BufferStackItem(Buffer.alloc(1, 1)),
          new BufferStackItem(Buffer.alloc(1, 0)),
          new BufferStackItem(Buffer.alloc(1, 2)),
          new BufferStackItem(Buffer.alloc(1, 3)),
        ],

        gas: FEES[400],
      },

      {
        op: 'DEPTH',
        args: [Buffer.alloc(1, 0), Buffer.alloc(1, 1)],
        result: [
          new IntegerStackItem(new BN(2)),
          new BufferStackItem(Buffer.alloc(1, 0)),
          new BufferStackItem(Buffer.alloc(1, 1)),
        ],

        gas: FEES[60],
      },

      {
        op: 'DROP',
        args: [Buffer.alloc(1, 0)],
        result: [],
        gas: FEES[60],
      },

      {
        op: 'DUP',
        args: [Buffer.alloc(1, 0)],
        result: [new BufferStackItem(Buffer.alloc(1, 0)), new BufferStackItem(Buffer.alloc(1, 0))],

        gas: FEES[60],
      },

      {
        op: 'NIP',
        args: [Buffer.alloc(1, 0), Buffer.alloc(1, 1)],
        result: [new BufferStackItem(Buffer.alloc(1, 0))],
        gas: FEES[60],
      },

      {
        op: 'OVER',
        args: [Buffer.alloc(1, 0), Buffer.alloc(1, 1)],
        result: [
          new BufferStackItem(Buffer.alloc(1, 1)),
          new BufferStackItem(Buffer.alloc(1, 0)),
          new BufferStackItem(Buffer.alloc(1, 1)),
        ],

        gas: FEES[60],
      },

      {
        op: 'PICK',
        args: [new BN(1), Buffer.alloc(1, 0), Buffer.alloc(1, 1)],
        result: [
          new BufferStackItem(Buffer.alloc(1, 1)),
          new BufferStackItem(Buffer.alloc(1, 0)),
          new BufferStackItem(Buffer.alloc(1, 1)),
        ],

        gas: FEES[60],
      },

      {
        op: 'ROLL',
        args: [new BN(1), Buffer.alloc(1, 0), Buffer.alloc(1, 1), Buffer.alloc(1, 2)],

        result: [
          new BufferStackItem(Buffer.alloc(1, 1)),
          new BufferStackItem(Buffer.alloc(1, 0)),
          new BufferStackItem(Buffer.alloc(1, 2)),
        ],

        gas: FEES[400],
      },

      {
        op: 'ROT',
        args: [Buffer.alloc(1, 3), Buffer.alloc(1, 2), Buffer.alloc(1, 1)],
        result: [
          new BufferStackItem(Buffer.alloc(1, 1)),
          new BufferStackItem(Buffer.alloc(1, 3)),
          new BufferStackItem(Buffer.alloc(1, 2)),
        ],

        gas: FEES[60],
      },

      {
        op: 'SWAP',
        args: [Buffer.alloc(1, 0), Buffer.alloc(1, 1)],
        result: [new BufferStackItem(Buffer.alloc(1, 1)), new BufferStackItem(Buffer.alloc(1, 0))],

        gas: FEES[60],
      },

      {
        op: 'TUCK',
        args: [Buffer.alloc(1, 0), Buffer.alloc(1, 1)],
        result: [
          new BufferStackItem(Buffer.alloc(1, 0)),
          new BufferStackItem(Buffer.alloc(1, 1)),
          new BufferStackItem(Buffer.alloc(1, 0)),
        ],

        gas: FEES[60],
      },

      {
        op: 'CAT',
        args: [Buffer.alloc(1, 0), Buffer.alloc(1, 1)],
        result: [new BufferStackItem(Buffer.concat([Buffer.alloc(1, 1), Buffer.alloc(1, 0)]))],

        gas: FEES[80_000],
      },

      {
        op: 'SUBSTR',
        args: [new BN(2), new BN(1), Buffer.from([11, 12, 13, 14, 15])],
        result: [new BufferStackItem(Buffer.from([12, 13]))],
        gas: FEES[80_000],
      },

      {
        op: 'LEFT',
        args: [new BN(2), Buffer.from([11, 12, 13, 14, 15])],
        result: [new BufferStackItem(Buffer.from([11, 12]))],
        gas: FEES[80_000],
      },

      {
        op: 'RIGHT',
        args: [new BN(2), Buffer.from([11, 12, 13, 14, 15])],
        result: [new BufferStackItem(Buffer.from([14, 15]))],
        gas: FEES[80_000],
      },

      {
        op: 'SIZE',
        args: [Buffer.alloc(10, 1)],
        result: [new IntegerStackItem(new BN(10))],
        gas: FEES[60],
      },

      {
        op: 'INVERT',
        args: [Buffer.alloc(10, 0x0f)],
        result: [new IntegerStackItem(utils.fromSignedBuffer(Buffer.alloc(10, 0xf0)))],

        gas: FEES[100],
      },

      {
        op: 'INVERT',
        args: [Buffer.alloc(1, 0xf0)],
        result: [new IntegerStackItem(utils.fromSignedBuffer(Buffer.alloc(1, 0x0f)))],

        gas: FEES[100],
      },

      {
        op: 'AND',
        args: [Buffer.alloc(10, 0x0a), Buffer.alloc(10, 0x0f)],
        result: [new IntegerStackItem(utils.fromSignedBuffer(Buffer.alloc(10, 0x0a)))],

        gas: FEES[200],
      },

      {
        op: 'AND',
        args: [Buffer.alloc(1, 0xa0), Buffer.alloc(1, 0xa0)],
        result: [new IntegerStackItem(utils.fromSignedBuffer(Buffer.alloc(1, 0xa0)))],

        gas: FEES[200],
      },

      {
        op: 'OR',
        args: [Buffer.alloc(10, 0xa0), Buffer.alloc(10, 0x0a)],
        result: [new IntegerStackItem(utils.fromSignedBuffer(Buffer.alloc(10, 0xaa)))],

        gas: FEES[200],
      },

      {
        op: 'OR',
        args: [Buffer.alloc(10, 0xaa), Buffer.alloc(10, 0xaa)],
        result: [new IntegerStackItem(utils.fromSignedBuffer(Buffer.alloc(10, 0xaa)))],

        gas: FEES[200],
      },

      {
        op: 'OR',
        args: [2, 128],
        result: [new IntegerStackItem(new BN(130))],
        gas: FEES[200],
      },

      {
        op: 'OR',
        args: [128, 2],
        result: [new IntegerStackItem(new BN(130))],
        gas: FEES[200],
      },

      {
        op: 'XOR',
        args: [Buffer.alloc(10, 0xa0), Buffer.alloc(10, 0x0a)],
        result: [new IntegerStackItem(utils.fromSignedBuffer(Buffer.alloc(10, 0xaa)))],

        gas: FEES[200],
      },

      {
        op: 'XOR',
        args: [Buffer.alloc(10, 0xaa), Buffer.alloc(10, 0xaa)],
        result: [new IntegerStackItem(utils.fromSignedBuffer(Buffer.alloc(10, 0x00)))],

        gas: FEES[200],
      },

      {
        op: 'EQUAL',
        args: [Buffer.alloc(10, 0x01), Buffer.alloc(10, 0x01)],
        result: [new BooleanStackItem(true)],
        gas: FEES[200],
      },

      {
        op: 'EQUAL',
        args: [Buffer.alloc(10, 0x01), []],
        result: [new BooleanStackItem(false)],
        gas: FEES[200],
      },

      {
        op: 'EQUAL',
        args: [new BN(1), []],
        result: [new BooleanStackItem(false)],
        gas: FEES[200],
      },

      {
        op: 'EQUAL',
        args: [true, []],
        result: [new BooleanStackItem(false)],
        gas: FEES[200],
      },

      {
        op: 'INC',
        args: [new BN(1)],
        result: [new IntegerStackItem(new BN(2))],
        gas: FEES[100],
      },

      {
        op: 'DEC',
        args: [new BN(2)],
        result: [new IntegerStackItem(new BN(1))],
        gas: FEES[100],
      },

      {
        op: 'SIGN',
        args: [new BN(0)],
        result: [new IntegerStackItem(utils.ZERO)],
        gas: FEES[100],
      },

      {
        op: 'SIGN',
        args: [new BN(-1)],
        result: [new IntegerStackItem(utils.NEGATIVE_ONE)],
        gas: FEES[100],
      },

      {
        op: 'SIGN',
        args: [new BN(5)],
        result: [new IntegerStackItem(utils.ONE)],
        gas: FEES[100],
      },

      {
        op: 'NEGATE',
        args: [new BN(5)],
        result: [new IntegerStackItem(new BN(-5))],
        gas: FEES[100],
      },

      {
        op: 'ABS',
        args: [new BN(-1)],
        result: [new IntegerStackItem(new BN(1))],
        gas: FEES[100],
      },

      {
        op: 'NOT',
        args: [true],
        result: [new BooleanStackItem(false)],
        gas: FEES[100],
      },

      {
        op: 'NZ',
        args: [new BN(5)],
        result: [new BooleanStackItem(true)],
        gas: FEES[100],
      },

      {
        op: 'NZ',
        args: [new BN(0)],
        result: [new BooleanStackItem(false)],
        gas: FEES[100],
      },

      {
        op: 'ADD',
        args: [new BN(1), new BN(5)],
        result: [new IntegerStackItem(new BN(6))],
        gas: FEES[200],
      },

      {
        op: 'SUB',
        args: [new BN(1), new BN(5)],
        result: [new IntegerStackItem(new BN(4))],
        gas: FEES[200],
      },

      {
        op: 'MUL',
        args: [new BN(2), new BN(5)],
        result: [new IntegerStackItem(new BN(10))],
        gas: FEES[300],
      },

      {
        op: 'DIV',
        args: [new BN(2), new BN(11)],
        result: [new IntegerStackItem(new BN(5))],
        gas: FEES[300],
      },

      {
        op: 'MOD',
        args: [new BN(2), new BN(5)],
        result: [new IntegerStackItem(new BN(1))],
        gas: FEES[300],
      },

      {
        op: 'SHL',
        args: [new BN(2), new BN(1)],
        result: [new IntegerStackItem(new BN(4))],
        gas: FEES[300],
      },

      {
        op: 'SHL',
        args: [new BN(2), new BN(-1)],
        result: [new IntegerStackItem(new BN(-4))],
        gas: FEES[300],
      },

      {
        op: 'SHR',
        args: [new BN(2), new BN(4)],
        result: [new IntegerStackItem(new BN(1))],
        gas: FEES[300],
      },

      {
        op: 'SHR',
        args: [new BN(2), new BN(-4)],
        result: [new IntegerStackItem(new BN(-2))],
        gas: FEES[300],
      },

      {
        op: 'BOOLAND',
        args: [true, false],
        result: [new BooleanStackItem(false)],
        gas: FEES[200],
      },

      {
        op: 'BOOLAND',
        args: [true, true],
        result: [new BooleanStackItem(true)],
        gas: FEES[200],
      },

      {
        op: 'BOOLAND',
        args: [false, false],
        result: [new BooleanStackItem(false)],
        gas: FEES[200],
      },

      {
        op: 'BOOLOR',
        args: [true, false],
        result: [new BooleanStackItem(true)],
        gas: FEES[200],
      },

      {
        op: 'BOOLOR',
        args: [true, true],
        result: [new BooleanStackItem(true)],
        gas: FEES[200],
      },

      {
        op: 'BOOLOR',
        args: [false, false],
        result: [new BooleanStackItem(false)],
        gas: FEES[200],
      },

      {
        op: 'NUMEQUAL',
        args: [new BN(4), new BN(4)],
        result: [new BooleanStackItem(true)],
        gas: FEES[200],
      },

      {
        op: 'NUMEQUAL',
        args: [new BN(4), new BN(5)],
        result: [new BooleanStackItem(false)],
        gas: FEES[200],
      },

      {
        op: 'NUMNOTEQUAL',
        args: [new BN(4), new BN(4)],
        result: [new BooleanStackItem(false)],
        gas: FEES[200],
      },

      {
        op: 'NUMNOTEQUAL',
        args: [new BN(4), new BN(5)],
        result: [new BooleanStackItem(true)],
        gas: FEES[200],
      },

      {
        op: 'LT',
        args: [new BN(4), new BN(5)],
        result: [new BooleanStackItem(false)],
        gas: FEES[200],
      },

      {
        op: 'LT',
        args: [new BN(6), new BN(5)],
        result: [new BooleanStackItem(true)],
        gas: FEES[200],
      },

      {
        op: 'GT',
        args: [new BN(4), new BN(5)],
        result: [new BooleanStackItem(true)],
        gas: FEES[200],
      },

      {
        op: 'GT',
        args: [new BN(6), new BN(5)],
        result: [new BooleanStackItem(false)],
        gas: FEES[200],
      },

      {
        op: 'LTE',
        args: [new BN(4), new BN(5)],
        result: [new BooleanStackItem(false)],
        gas: FEES[200],
      },

      {
        op: 'LTE',
        args: [new BN(4), new BN(4)],
        result: [new BooleanStackItem(true)],
        gas: FEES[200],
      },

      {
        op: 'LTE',
        args: [new BN(4), new BN(3)],
        result: [new BooleanStackItem(true)],
        gas: FEES[200],
      },

      {
        op: 'GTE',
        args: [new BN(4), new BN(5)],
        result: [new BooleanStackItem(true)],
        gas: FEES[200],
      },

      {
        op: 'GTE',
        args: [new BN(4), new BN(4)],
        result: [new BooleanStackItem(true)],
        gas: FEES[200],
      },

      {
        op: 'GTE',
        args: [new BN(4), new BN(3)],
        result: [new BooleanStackItem(false)],
        gas: FEES[200],
      },

      {
        op: 'MIN',
        args: [new BN(2), new BN(3)],
        result: [new IntegerStackItem(new BN(2))],
        gas: FEES[200],
      },

      {
        op: 'MAX',
        args: [new BN(2), new BN(3)],
        result: [new IntegerStackItem(new BN(3))],
        gas: FEES[200],
      },

      {
        op: 'WITHIN',
        args: [new BN(2), new BN(3), new BN(4)],
        result: [new BooleanStackItem(false)],
        gas: FEES[200],
      },

      {
        op: 'WITHIN',
        args: [new BN(5), new BN(3), new BN(4)],
        result: [new BooleanStackItem(true)],
        gas: FEES[200],
      },

      {
        op: 'ARRAYSIZE',
        args: [[true, false]],
        result: [new IntegerStackItem(new BN(2))],
        gas: FEES[150],
      },

      {
        op: 'PACK',
        args: [new BN(1), Buffer.alloc(1, 0), Buffer.alloc(1, 1), Buffer.alloc(1, 2)],

        result: [
          new ArrayStackItem([new BufferStackItem(Buffer.alloc(1, 0))]),
          new BufferStackItem(Buffer.alloc(1, 1)),
          new BufferStackItem(Buffer.alloc(1, 2)),
        ],

        gas: FEES[7_000],
      },

      {
        op: 'UNPACK',
        args: [[new BN(4), new BN(5)]],
        result: [new IntegerStackItem(new BN(2)), new IntegerStackItem(new BN(4)), new IntegerStackItem(new BN(5))],

        gas: FEES[7_000],
      },

      {
        op: 'PICKITEM',
        args: [new BN(1), [Buffer.alloc(1, 0), Buffer.alloc(1, 1), Buffer.alloc(1, 2)]],

        result: [new BufferStackItem(Buffer.alloc(1, 1))],
        gas: FEES[270_000],
      },

      {
        op: 'PICKITEM',
        stackItems: [new BufferStackItem(Buffer.from('aaaa', 'hex')), mapStatic],
        result: [new IntegerStackItem(new BN(1))],
        gas: FEES[270_000],
      },

      {
        op: 'PICKITEM',
        stackItems: [
          new IntegerStackItem(new BN(1)),
          new StructStackItem([
            new IntegerStackItem(new BN(1)),
            new StructStackItem([new IntegerStackItem(new BN(1))]),
          ]),
        ],
        result: [new StructStackItem([new IntegerStackItem(new BN(1))])],
        gas: FEES[270_000],
      },

      {
        op: 'SETITEM',
        ref: setRef,
        stackItems: [new IntegerStackItem(new BN(5)), new IntegerStackItem(new BN(0)), setRef],

        result: [new ArrayStackItem([new IntegerStackItem(new BN(5))])],
        gas: FEES[270_000],
      },

      {
        op: 'SETITEM',
        ref: mapSetRef,
        stackItems: [new IntegerStackItem(new BN(5)), new BufferStackItem(Buffer.from('dddd', 'hex')), mapSetRef],

        result: [
          new MapStackItem({
            referenceKeys: new Map([
              [
                new BufferStackItem(Buffer.from('aaaa', 'hex')).toStructuralKey(),
                new BufferStackItem(Buffer.from('aaaa', 'hex')),
              ] as const,
              [
                new BufferStackItem(Buffer.from('bbbb', 'hex')).toStructuralKey(),
                new BufferStackItem(Buffer.from('bbbb', 'hex')),
              ] as const,
              [
                new BufferStackItem(Buffer.from('dddd', 'hex')).toStructuralKey(),
                new BufferStackItem(Buffer.from('dddd', 'hex')),
              ] as const,
            ]),
            referenceValues: new Map([
              [
                new BufferStackItem(Buffer.from('aaaa', 'hex')).toStructuralKey(),
                new IntegerStackItem(new BN(1)),
              ] as const,
              [
                new BufferStackItem(Buffer.from('bbbb', 'hex')).toStructuralKey(),
                new IntegerStackItem(new BN(2)),
              ] as const,
              [
                new BufferStackItem(Buffer.from('dddd', 'hex')).toStructuralKey(),
                new IntegerStackItem(new BN(5)),
              ] as const,
            ]),
          }),
        ],

        gas: FEES[270_000],
      },

      {
        op: 'NEWARRAY',
        args: [new BN(3)],
        result: [
          new ArrayStackItem([new BooleanStackItem(false), new BooleanStackItem(false), new BooleanStackItem(false)]),
        ],

        gas: FEES[15_000],
      },

      {
        op: 'NEWARRAY',
        args: [[new BN(1), new BN(2), new BN(3)]],
        result: [
          new ArrayStackItem([
            new IntegerStackItem(new BN(1)),
            new IntegerStackItem(new BN(2)),
            new IntegerStackItem(new BN(3)),
          ]),
        ],

        gas: FEES[15_000],
      },

      {
        op: 'NEWARRAY',
        stackItems: [simpleStruct],
        result: [new ArrayStackItem([new IntegerStackItem(new BN(1))])],

        gas: FEES[15_000],
      },

      {
        op: 'NEWSTRUCT',
        args: [new BN(3)],
        result: [
          new StructStackItem([new BooleanStackItem(false), new BooleanStackItem(false), new BooleanStackItem(false)]),
        ],

        gas: FEES[15_000],
      },

      {
        op: 'NEWSTRUCT',
        args: [[new BN(1), new BN(2), new BN(3)]],
        result: [
          new StructStackItem([
            new IntegerStackItem(new BN(1)),
            new IntegerStackItem(new BN(2)),
            new IntegerStackItem(new BN(3)),
          ]),
        ],

        gas: FEES[15_000],
      },

      {
        op: 'NEWSTRUCT',
        stackItems: [simpleStruct],
        result: [new StructStackItem([new IntegerStackItem(new BN(1))])],

        gas: FEES[15_000],
      },

      {
        op: 'NEWMAP',
        result: [new MapStackItem()],
        gas: FEES[200],
      },

      {
        op: 'APPEND',
        ref: appendRef,
        stackItems: [new IntegerStackItem(new BN(3)), appendRef],
        result: [new ArrayStackItem([new IntegerStackItem(new BN(3))])],
        gas: FEES[15_000],
      },

      {
        op: 'APPEND',
        stackItems: [simpleStruct, simpleStruct, simpleStruct],
        result: [
          new StructStackItem([
            new IntegerStackItem(new BN(1)),
            new StructStackItem([new IntegerStackItem(new BN(1))]),
          ]),
        ],
        gas: FEES[15_000],
      },

      {
        op: 'REVERSE',
        ref: reverseRef,
        stackItems: [reverseRef],
        result: [
          new ArrayStackItem([
            new IntegerStackItem(new BN(3)),
            new IntegerStackItem(new BN(2)),
            new IntegerStackItem(new BN(1)),
          ]),
        ],

        gas: FEES[500],
      },

      {
        op: 'REMOVE',
        ref: removeRef,
        stackItems: [new IntegerStackItem(new BN(1)), removeRef],
        result: [new ArrayStackItem([new IntegerStackItem(new BN(1))])],
        gas: FEES[500],
      },

      {
        op: 'REMOVE',
        ref: mapRemoveRef,
        stackItems: [new BufferStackItem(Buffer.from('bbbb', 'hex')), mapRemoveRef],

        result: [
          new MapStackItem({
            referenceKeys: new Map([
              [
                new BufferStackItem(Buffer.from('aaaa', 'hex')).toStructuralKey(),
                new BufferStackItem(Buffer.from('aaaa', 'hex')),
              ] as const,
            ]),
            referenceValues: new Map([
              [
                new BufferStackItem(Buffer.from('aaaa', 'hex')).toStructuralKey(),
                new IntegerStackItem(new BN(1)),
              ] as const,
            ]),
          }),
        ],

        gas: FEES[500],
      },

      {
        op: 'HASKEY',
        args: [new BN(1), [new BN(0), new BN(1)]],
        result: [new BooleanStackItem(true)],
        gas: FEES[270_000],
      },

      {
        op: 'HASKEY',
        args: [new BN(2), [new BN(0), new BN(1)]],
        result: [new BooleanStackItem(false)],
        gas: FEES[270_000],
      },

      {
        op: 'HASKEY',
        stackItems: [new BufferStackItem(Buffer.from('aaaa', 'hex')), mapStatic],
        result: [new BooleanStackItem(true)],
        gas: FEES[270_000],
      },

      {
        op: 'HASKEY',
        stackItems: [new BufferStackItem(Buffer.from('cccc', 'hex')), mapStatic],
        result: [new BooleanStackItem(false)],
        gas: FEES[270_000],
      },

      {
        op: 'KEYS',
        stackItems: [mapStatic],
        result: [mapStatic.keys()],
        gas: FEES[500],
      },

      {
        op: 'VALUES',
        args: [[new BN(1), new BN(2)]],
        result: [new ArrayStackItem([new IntegerStackItem(new BN(1)), new IntegerStackItem(new BN(2))])],

        gas: FEES[7_000],
      },

      {
        op: 'VALUES',
        stackItems: [mapStatic],
        result: [new ArrayStackItem(mapStatic.valuesArray())],
        gas: FEES[7_000],
      },
    ],

    // {
    //   op: 'THROW',
    // },
    // {
    //   op: 'THROWIFNOT',
    // },
  ) as readonly TestCase[];

describe('opcodes', () => {
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

  for (const testCase of OPCODES) {
    const {
      op,
      postOps = [],
      result,
      resultAlt,
      gas,
      buffer,
      args = [],
      argsAlt = [],
      preOps = [],
      stackItems = [],
      ref,
      mockBlockchain,
      mockTransaction,
      returnValueCount,
    } = testCase;
    test(op, async () => {
      const sb = new ScriptBuilder();
      for (const { op: preOp, buffer: preBuffer } of preOps) {
        sb.emitOp(preOp, preBuffer);
      }

      sb.emitOp(op, buffer);

      for (const { op: postOp, buffer: postBuffer } of postOps) {
        sb.emitOp(postOp, postBuffer);
      }

      const transaction = transactions.createInvocation({
        script: sb.build(),
        attributes: [
          new UInt160Attribute({
            usage: AttributeUsage.Script,
            value: scriptAttributeHash,
          }),
        ],
      });

      if (mockTransaction !== undefined) {
        mockTransaction({ transaction });
      }

      const blockchain = {
        output: {},
        asset: {},
        action: {
          add: jest.fn(() => {
            // do nothing
          }),
        },

        contract: {},
        currentBlock: {},
      };

      const block = { timestamp: blockTime };
      const init: ExecutionInit = {
        scriptContainer: {
          type: ScriptContainerType.Transaction,
          value: transaction as Transaction,
        },

        triggerType,
        action: NULL_ACTION,
        listeners: {},
        skipWitnessVerify: false,
        persistingBlock: block as any,
      };

      const gasLeft = utils.ONE_HUNDRED_MILLION;
      let stack: readonly StackItem[] = [];
      let stackAlt: readonly StackItem[] = [];
      if (mockBlockchain !== undefined) {
        mockBlockchain({ blockchain });
      }

      if (args.length) {
        const argsSB = new ScriptBuilder();
        argsSB.emitPushParams(...args);
        const argsContext = await executeScript({
          code: argsSB.build(),
          blockchain: blockchain as any,
          init,
          gasLeft,
        });

        ({ stack } = argsContext);
      } else if (stackItems.length) {
        stack = stackItems;
      }

      if (argsAlt.length) {
        const argsAltSB = new ScriptBuilder();
        argsAltSB.emitPushParams(...argsAlt);
        const argsAltContext = await executeScript({
          code: argsAltSB.build(),
          blockchain: blockchain as any,
          init,
          gasLeft,
        });

        stackAlt = argsAltContext.stack;
      }

      const context = await executeScript({
        code: transaction.script,
        blockchain: blockchain as any,
        init,
        gasLeft,
        options: { stack, stackAlt, returnValueCount } as any,
      });

      expect(context.errorMessage).toBeUndefined();
      if (resultAlt) {
        expect(filterMethods(context.stackAlt)).toEqual(filterMethods(resultAlt));
      }

      if (stackItems.length && ref) {
        expect(filterMethods(ref)).toEqual(filterMethods(result[0]));
      } else {
        expect(context.stack.length).toEqual(result.length);
        for (const [idx, item] of context.stack.entries()) {
          const resultItem = result[idx];
          if (item instanceof IntegerStackItem && resultItem instanceof IntegerStackItem) {
            expect(item.asBigInteger().toString(10)).toEqual(resultItem.asBigInteger().toString(10));
          } else {
            expect(filterMethods(item)).toEqual(filterMethods(resultItem));
          }
        }
      }
      expect(gasLeft.sub(context.gasLeft).toString(10)).toEqual(gas.toString(10));
    });
  }
});
