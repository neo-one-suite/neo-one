/* @flow */
import { NULL_ACTION, TRIGGER_TYPE } from '@neo-one/node-core';
import {
  type OpCode,
  type Param,
  ATTRIBUTE_USAGE,
  SCRIPT_CONTAINER_TYPE,
  UInt160Attribute,
  ScriptBuilder,
  utils,
  crypto,
} from '@neo-one/client-core';
import BN from 'bn.js';

import { FEES } from '../constants';
import {
  type StackItem,
  BufferStackItem,
  IntegerStackItem,
  BooleanStackItem,
  UInt160StackItem,
  UInt256StackItem,
  ArrayStackItem,
  StructStackItem,
  MapStackItem,
} from '../stackItem';

import { executeScript } from '../execute';
import { keys, transactions } from '../__data__';

const triggerType = TRIGGER_TYPE.APPLICATION;
const scriptAttributeHash = keys[0].scriptHash;
const blockTime = Date.now();

type TestCase = {|
  op: OpCode,
  result: Array<StackItem>,
  gas: BN,
  args?: Array<?Param>,
  buffer?: Buffer,
  // state?: VMState,
|};

const SYSCALLS = ([
  {
    op: 'PUSH0',
    result: [new BufferStackItem(Buffer.from([]))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES1',
    buffer: Buffer.alloc(1, 10),
    result: [new BufferStackItem(Buffer.alloc(1, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES2',
    buffer: Buffer.alloc(2, 10),
    result: [new BufferStackItem(Buffer.alloc(2, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES3',
    buffer: Buffer.alloc(3, 10),
    result: [new BufferStackItem(Buffer.alloc(3, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES4',
    buffer: Buffer.alloc(4, 10),
    result: [new BufferStackItem(Buffer.alloc(4, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES5',
    buffer: Buffer.alloc(5, 10),
    result: [new BufferStackItem(Buffer.alloc(5, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES6',
    buffer: Buffer.alloc(6, 10),
    result: [new BufferStackItem(Buffer.alloc(6, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES7',
    buffer: Buffer.alloc(7, 10),
    result: [new BufferStackItem(Buffer.alloc(7, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES8',
    buffer: Buffer.alloc(8, 10),
    result: [new BufferStackItem(Buffer.alloc(8, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES9',
    buffer: Buffer.alloc(9, 10),
    result: [new BufferStackItem(Buffer.alloc(9, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES10',
    buffer: Buffer.alloc(10, 10),
    result: [new BufferStackItem(Buffer.alloc(10, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES11',
    buffer: Buffer.alloc(11, 10),
    result: [new BufferStackItem(Buffer.alloc(11, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES12',
    buffer: Buffer.alloc(12, 10),
    result: [new BufferStackItem(Buffer.alloc(12, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES13',
    buffer: Buffer.alloc(13, 10),
    result: [new BufferStackItem(Buffer.alloc(13, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES14',
    buffer: Buffer.alloc(14, 10),
    result: [new BufferStackItem(Buffer.alloc(14, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES15',
    buffer: Buffer.alloc(15, 10),
    result: [new BufferStackItem(Buffer.alloc(15, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES16',
    buffer: Buffer.alloc(16, 10),
    result: [new BufferStackItem(Buffer.alloc(16, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES17',
    buffer: Buffer.alloc(17, 10),
    result: [new BufferStackItem(Buffer.alloc(17, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES18',
    buffer: Buffer.alloc(18, 10),
    result: [new BufferStackItem(Buffer.alloc(18, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES19',
    buffer: Buffer.alloc(19, 10),
    result: [new BufferStackItem(Buffer.alloc(19, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES20',
    buffer: Buffer.alloc(20, 10),
    result: [new BufferStackItem(Buffer.alloc(20, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES21',
    buffer: Buffer.alloc(21, 10),
    result: [new BufferStackItem(Buffer.alloc(21, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES22',
    buffer: Buffer.alloc(22, 10),
    result: [new BufferStackItem(Buffer.alloc(22, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES23',
    buffer: Buffer.alloc(23, 10),
    result: [new BufferStackItem(Buffer.alloc(23, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES24',
    buffer: Buffer.alloc(24, 10),
    result: [new BufferStackItem(Buffer.alloc(24, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES25',
    buffer: Buffer.alloc(25, 10),
    result: [new BufferStackItem(Buffer.alloc(25, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES26',
    buffer: Buffer.alloc(26, 10),
    result: [new BufferStackItem(Buffer.alloc(26, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES27',
    buffer: Buffer.alloc(27, 10),
    result: [new BufferStackItem(Buffer.alloc(27, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES28',
    buffer: Buffer.alloc(28, 10),
    result: [new BufferStackItem(Buffer.alloc(28, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES29',
    buffer: Buffer.alloc(29, 10),
    result: [new BufferStackItem(Buffer.alloc(29, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES30',
    buffer: Buffer.alloc(30, 10),
    result: [new BufferStackItem(Buffer.alloc(30, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES31',
    buffer: Buffer.alloc(31, 10),
    result: [new BufferStackItem(Buffer.alloc(31, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES32',
    buffer: Buffer.alloc(32, 10),
    result: [new BufferStackItem(Buffer.alloc(32, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES33',
    buffer: Buffer.alloc(33, 10),
    result: [new BufferStackItem(Buffer.alloc(33, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES34',
    buffer: Buffer.alloc(34, 10),
    result: [new BufferStackItem(Buffer.alloc(34, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES35',
    buffer: Buffer.alloc(35, 10),
    result: [new BufferStackItem(Buffer.alloc(35, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES36',
    buffer: Buffer.alloc(36, 10),
    result: [new BufferStackItem(Buffer.alloc(36, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES37',
    buffer: Buffer.alloc(37, 10),
    result: [new BufferStackItem(Buffer.alloc(37, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES38',
    buffer: Buffer.alloc(38, 10),
    result: [new BufferStackItem(Buffer.alloc(38, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES39',
    buffer: Buffer.alloc(39, 10),
    result: [new BufferStackItem(Buffer.alloc(39, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES40',
    buffer: Buffer.alloc(40, 10),
    result: [new BufferStackItem(Buffer.alloc(40, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES41',
    buffer: Buffer.alloc(41, 10),
    result: [new BufferStackItem(Buffer.alloc(41, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES42',
    buffer: Buffer.alloc(42, 10),
    result: [new BufferStackItem(Buffer.alloc(42, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES43',
    buffer: Buffer.alloc(43, 10),
    result: [new BufferStackItem(Buffer.alloc(43, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES44',
    buffer: Buffer.alloc(44, 10),
    result: [new BufferStackItem(Buffer.alloc(44, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES45',
    buffer: Buffer.alloc(45, 10),
    result: [new BufferStackItem(Buffer.alloc(45, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES46',
    buffer: Buffer.alloc(46, 10),
    result: [new BufferStackItem(Buffer.alloc(46, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES47',
    buffer: Buffer.alloc(47, 10),
    result: [new BufferStackItem(Buffer.alloc(47, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES48',
    buffer: Buffer.alloc(48, 10),
    result: [new BufferStackItem(Buffer.alloc(48, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES49',
    buffer: Buffer.alloc(49, 10),
    result: [new BufferStackItem(Buffer.alloc(49, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES50',
    buffer: Buffer.alloc(50, 10),
    result: [new BufferStackItem(Buffer.alloc(50, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES51',
    buffer: Buffer.alloc(51, 10),
    result: [new BufferStackItem(Buffer.alloc(51, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES52',
    buffer: Buffer.alloc(52, 10),
    result: [new BufferStackItem(Buffer.alloc(52, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES53',
    buffer: Buffer.alloc(53, 10),
    result: [new BufferStackItem(Buffer.alloc(53, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES54',
    buffer: Buffer.alloc(54, 10),
    result: [new BufferStackItem(Buffer.alloc(54, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES55',
    buffer: Buffer.alloc(55, 10),
    result: [new BufferStackItem(Buffer.alloc(55, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES56',
    buffer: Buffer.alloc(56, 10),
    result: [new BufferStackItem(Buffer.alloc(56, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES57',
    buffer: Buffer.alloc(57, 10),
    result: [new BufferStackItem(Buffer.alloc(57, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES58',
    buffer: Buffer.alloc(58, 10),
    result: [new BufferStackItem(Buffer.alloc(58, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES59',
    buffer: Buffer.alloc(59, 10),
    result: [new BufferStackItem(Buffer.alloc(59, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES60',
    buffer: Buffer.alloc(60, 10),
    result: [new BufferStackItem(Buffer.alloc(60, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES61',
    buffer: Buffer.alloc(61, 10),
    result: [new BufferStackItem(Buffer.alloc(61, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES62',
    buffer: Buffer.alloc(62, 10),
    result: [new BufferStackItem(Buffer.alloc(62, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES63',
    buffer: Buffer.alloc(63, 10),
    result: [new BufferStackItem(Buffer.alloc(63, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES64',
    buffer: Buffer.alloc(64, 10),
    result: [new BufferStackItem(Buffer.alloc(64, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES65',
    buffer: Buffer.alloc(65, 10),
    result: [new BufferStackItem(Buffer.alloc(65, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES66',
    buffer: Buffer.alloc(66, 10),
    result: [new BufferStackItem(Buffer.alloc(66, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES67',
    buffer: Buffer.alloc(67, 10),
    result: [new BufferStackItem(Buffer.alloc(67, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES68',
    buffer: Buffer.alloc(68, 10),
    result: [new BufferStackItem(Buffer.alloc(68, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES69',
    buffer: Buffer.alloc(69, 10),
    result: [new BufferStackItem(Buffer.alloc(69, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES70',
    buffer: Buffer.alloc(70, 10),
    result: [new BufferStackItem(Buffer.alloc(70, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES71',
    buffer: Buffer.alloc(71, 10),
    result: [new BufferStackItem(Buffer.alloc(71, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES72',
    buffer: Buffer.alloc(72, 10),
    result: [new BufferStackItem(Buffer.alloc(72, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES73',
    buffer: Buffer.alloc(73, 10),
    result: [new BufferStackItem(Buffer.alloc(73, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES75',
    buffer: Buffer.alloc(75, 10),
    result: [new BufferStackItem(Buffer.alloc(75, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHDATA1',
    buffer: Buffer.from([2, 10, 10]),
    result: [new BufferStackItem(Buffer.alloc(2, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHDATA2',
    buffer: Buffer.concat([Buffer.from([1, 1]), Buffer.alloc(257, 10)], 259),
    result: [new BufferStackItem(Buffer.alloc(257, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHDATA4',
    buffer: Buffer.concat(
      [Buffer.from([1, 1, 0, 0]), Buffer.alloc(257, 10)],
      261,
    ),
    result: [new BufferStackItem(Buffer.alloc(257, 10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHM1',
    result: [new IntegerStackItem(new BN(-1))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSH1',
    result: [new IntegerStackItem(new BN(1))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSH2',
    result: [new IntegerStackItem(new BN(2))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSH3',
    result: [new IntegerStackItem(new BN(3))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSH4',
    result: [new IntegerStackItem(new BN(4))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSH5',
    result: [new IntegerStackItem(new BN(5))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSH6',
    result: [new IntegerStackItem(new BN(6))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSH7',
    result: [new IntegerStackItem(new BN(7))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSH8',
    result: [new IntegerStackItem(new BN(8))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSH9',
    result: [new IntegerStackItem(new BN(9))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSH10',
    result: [new IntegerStackItem(new BN(10))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSH11',
    result: [new IntegerStackItem(new BN(11))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSH12',
    result: [new IntegerStackItem(new BN(12))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSH13',
    result: [new IntegerStackItem(new BN(13))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSH14',
    result: [new IntegerStackItem(new BN(14))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSH15',
    result: [new IntegerStackItem(new BN(15))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSH16',
    result: [new IntegerStackItem(new BN(16))],
    gas: utils.ZERO,
  },
  {
    op: 'NOP',
    result: [],
    gas: utils.ZERO,
  },
  {
    op: 'JMP',
    buffer: Buffer.concat([
      Buffer.from([5, 0]),
      Buffer.from([11, 12, 13, 14, 15]),
    ]),
    result: [new BufferStackItem(Buffer.from([14, 15]))],
    gas: FEES.ONE,
  },
  {
    op: 'JMPIF',
    args: [Buffer.alloc(1, 1)],
    buffer: Buffer.concat([
      Buffer.from([5, 0]),
      Buffer.from([11, 12, 13, 14, 15]),
    ]),
    result: [new BufferStackItem(Buffer.from([14, 15]))],
    gas: FEES.ONE,
  },
  {
    op: 'JMPIF',
    args: [Buffer.alloc(1, 0)],
    buffer: Buffer.concat([
      Buffer.from([5, 0]),
      Buffer.from([11, 12, 13, 14, 15]),
    ]),
    result: [new BufferStackItem(Buffer.from([12, 13, 14, 15]))],
    gas: FEES.ONE,
  },
  {
    op: 'JMPIFNOT',
    args: [Buffer.alloc(1, 0)],
    buffer: Buffer.concat([
      Buffer.from([5, 0]),
      Buffer.from([11, 12, 13, 14, 15]),
    ]),
    result: [new BufferStackItem(Buffer.from([14, 15]))],
    gas: FEES.ONE,
  },
  {
    op: 'JMPIFNOT',
    args: [Buffer.alloc(1, 1)],
    buffer: Buffer.concat([
      Buffer.from([5, 0]),
      Buffer.from([11, 12, 13, 14, 15]),
    ]),
    result: [new BufferStackItem(Buffer.from([12, 13, 14, 15]))],
    gas: FEES.ONE,
  },
  {
    op: 'CALL',
    buffer: Buffer.concat([
      Buffer.from([5, 0]),
      Buffer.from([11, 12, 13, 14, 15]),
    ]),
    result: [
      new BufferStackItem(Buffer.from([12, 13, 14, 15])),
      new BufferStackItem(Buffer.from([14, 15])),
    ],
    gas: FEES.ONE,
  },
  {
    op: 'RET',
    result: [],
    gas: FEES.ONE,
  },
  // {
  //   op: 'APPCALL',
  //   gas: FEES.TEN,
  // },
  // {
  //   op: 'SYSCALL',
  // },
  // {
  //   op: 'TAILCALL',
  // },
  // {
  //   op: 'DUPFROMALTSTACK',
  // },
  // {
  //   op: 'TOALTSTACK',
  // },
  // {
  //   op: 'FROMALTSTACK',
  // },
  {
    op: 'XDROP',
    args: [new BN(1), Buffer.alloc(1, 1), Buffer.alloc(1, 0)],
    result: [new BufferStackItem(Buffer.alloc(1, 1))],
    gas: FEES.ONE,
  },
  {
    op: 'XSWAP',
    args: [new BN(1), Buffer.alloc(1, 1), Buffer.alloc(1, 0)],
    result: [
      new BufferStackItem(Buffer.alloc(1, 0)),
      new BufferStackItem(Buffer.alloc(1, 1)),
    ],
    gas: FEES.ONE,
  },
  {
    op: 'XTUCK',
    args: [
      new BN(2),
      Buffer.alloc(1, 0),
      Buffer.alloc(1, 1),
      Buffer.alloc(1, 2),
      Buffer.alloc(1, 3),
    ],
    result: [
      new BufferStackItem(Buffer.alloc(1, 0)),
      new BufferStackItem(Buffer.alloc(1, 1)),
      new BufferStackItem(Buffer.alloc(1, 0)),
      new BufferStackItem(Buffer.alloc(1, 2)),
      new BufferStackItem(Buffer.alloc(1, 3)),
    ],
    gas: FEES.ONE,
  },
  {
    op: 'DEPTH',
    args: [Buffer.alloc(1, 0), Buffer.alloc(1, 1)],
    result: [
      new IntegerStackItem(new BN(2)),
      new BufferStackItem(Buffer.alloc(1, 0)),
      new BufferStackItem(Buffer.alloc(1, 1)),
    ],
    gas: FEES.ONE,
  },
  {
    op: 'DROP',
    args: [Buffer.alloc(1, 0)],
    result: [],
    gas: FEES.ONE,
  },
  {
    op: 'DUP',
    args: [Buffer.alloc(1, 0)],
    result: [
      new BufferStackItem(Buffer.alloc(1, 0)),
      new BufferStackItem(Buffer.alloc(1, 0)),
    ],
    gas: FEES.ONE,
  },
  {
    op: 'NIP',
    args: [Buffer.alloc(1, 0), Buffer.alloc(1, 1)],
    result: [new BufferStackItem(Buffer.alloc(1, 0))],
    gas: FEES.ONE,
  },
  {
    op: 'OVER',
    args: [Buffer.alloc(1, 0), Buffer.alloc(1, 1)],
    result: [
      new BufferStackItem(Buffer.alloc(1, 1)),
      new BufferStackItem(Buffer.alloc(1, 0)),
      new BufferStackItem(Buffer.alloc(1, 1)),
    ],
    gas: FEES.ONE,
  },
  {
    op: 'PICK',
    args: [new BN(1), Buffer.alloc(1, 0), Buffer.alloc(1, 1)],
    result: [
      new BufferStackItem(Buffer.alloc(1, 1)),
      new BufferStackItem(Buffer.alloc(1, 0)),
      new BufferStackItem(Buffer.alloc(1, 1)),
    ],
    gas: FEES.ONE,
  },
  {
    op: 'ROLL',
    args: [
      new BN(1),
      Buffer.alloc(1, 0),
      Buffer.alloc(1, 1),
      Buffer.alloc(1, 2),
    ],
    result: [
      new BufferStackItem(Buffer.alloc(1, 1)),
      new BufferStackItem(Buffer.alloc(1, 0)),
      new BufferStackItem(Buffer.alloc(1, 2)),
    ],
    gas: FEES.ONE,
  },
  // Arg direction for ROT???
  {
    op: 'ROT',
    args: [Buffer.alloc(1, 0), Buffer.alloc(1, 1), Buffer.alloc(1, 2)],
    result: [
      new BufferStackItem(Buffer.alloc(1, 2)),
      new BufferStackItem(Buffer.alloc(1, 0)),
      new BufferStackItem(Buffer.alloc(1, 1)),
    ],
    gas: FEES.ONE,
  },
  {
    op: 'SWAP',
    args: [Buffer.alloc(1, 0), Buffer.alloc(1, 1)],
    result: [
      new BufferStackItem(Buffer.alloc(1, 1)),
      new BufferStackItem(Buffer.alloc(1, 0)),
    ],
    gas: FEES.ONE,
  },
  {
    op: 'TUCK',
    args: [Buffer.alloc(1, 0), Buffer.alloc(1, 1)],
    result: [
      new BufferStackItem(Buffer.alloc(1, 0)),
      new BufferStackItem(Buffer.alloc(1, 1)),
      new BufferStackItem(Buffer.alloc(1, 0)),
    ],
    gas: FEES.ONE,
  },
  {
    op: 'CAT',
    args: [Buffer.alloc(1, 0), Buffer.alloc(1, 1)],
    result: [
      new BufferStackItem(
        Buffer.concat([Buffer.alloc(1, 1), Buffer.alloc(1, 0)]),
      ),
    ],
    gas: FEES.ONE,
  },
  {
    op: 'SUBSTR',
    args: [new BN(2), new BN(1), Buffer.from([11, 12, 13, 14, 15])],
    result: [new BufferStackItem(Buffer.from([12, 13]))],
    gas: FEES.ONE,
  },
  {
    op: 'LEFT',
    args: [new BN(2), Buffer.from([11, 12, 13, 14, 15])],
    result: [new BufferStackItem(Buffer.from([11, 12]))],
    gas: FEES.ONE,
  },
  {
    op: 'RIGHT',
    args: [new BN(2), Buffer.from([11, 12, 13, 14, 15])],
    result: [new BufferStackItem(Buffer.from([14, 15]))],
    gas: FEES.ONE,
  },
  {
    op: 'SIZE',
    args: [Buffer.alloc(10, 1)],
    result: [new IntegerStackItem(new BN(10))],
    gas: FEES.ONE,
  },
  {
    op: 'INVERT',
    args: [new BN(2)],
    result: [new IntegerStackItem(new BN(1))],
    gas: FEES.ONE,
  },
  {
    op: 'AND',
    args: [new BN(1), new BN(3)],
    result: [new IntegerStackItem(new BN(1))],
    gas: FEES.ONE,
  },
  {
    op: 'OR',
    args: [new BN(1), new BN(3)],
    result: [new IntegerStackItem(new BN(3))],
    gas: FEES.ONE,
  },
  {
    op: 'XOR',
    args: [new BN(1), new BN(3)],
    result: [new IntegerStackItem(new BN(2))],
    gas: FEES.ONE,
  },
  {
    op: 'EQUAL',
    args: [Buffer.alloc(1, 0), Buffer.alloc(1, 0)],
    result: [new BooleanStackItem(true)],
    gas: FEES.ONE,
  },
  // {
  //   op: 'OP_EQUALVERIFY',
  // },
  // {
  //   op: 'OP_RESERVED1',
  // },
  // {
  //   op: 'OP_RESERVED2',
  // },
  {
    op: 'INC',
    args: [new BN(1)],
    result: [new IntegerStackItem(new BN(2))],
    gas: FEES.ONE,
  },
  {
    op: 'DEC',
    args: [new BN(2)],
    result: [new IntegerStackItem(new BN(1))],
    gas: FEES.ONE,
  },
  {
    op: 'SIGN',
    args: [new BN(0)],
    result: [new IntegerStackItem(utils.ZERO)],
    gas: FEES.ONE,
  },
  {
    op: 'SIGN',
    args: [new BN(-1)],
    result: [new IntegerStackItem(utils.NEGATIVE_ONE)],
    gas: FEES.ONE,
  },
  {
    op: 'SIGN',
    args: [new BN(5)],
    result: [new IntegerStackItem(utils.ONE)],
    gas: FEES.ONE,
  },
  {
    op: 'NEGATE',
    args: [new BN(5)],
    result: [new IntegerStackItem(new BN(5).neg())],
    gas: FEES.ONE,
  },
  {
    op: 'ABS',
    args: [new BN(-1)],
    result: [new IntegerStackItem(new BN(1))],
    gas: FEES.ONE,
  },
  {
    op: 'NOT',
    args: [true],
    result: [new BooleanStackItem(false)],
    gas: FEES.ONE,
  },
  {
    op: 'NZ',
    args: [new BN(5)],
    result: [new BooleanStackItem(true)],
    gas: FEES.ONE,
  },
  {
    op: 'NZ',
    args: [new BN(0)],
    result: [new BooleanStackItem(false)],
    gas: FEES.ONE,
  },
  {
    op: 'ADD',
    args: [new BN(1), new BN(5)],
    result: [new IntegerStackItem(new BN(6))],
    gas: FEES.ONE,
  },
  {
    op: 'SUB',
    args: [new BN(1), new BN(5)],
    result: [new IntegerStackItem(new BN(4))],
    gas: FEES.ONE,
  },
  {
    op: 'MUL',
    args: [new BN(2), new BN(5)],
    result: [new IntegerStackItem(new BN(10))],
    gas: FEES.ONE,
  },
  {
    op: 'DIV',
    args: [new BN(2), new BN(10)],
    result: [new IntegerStackItem(new BN(5))],
    gas: FEES.ONE,
  },
  {
    op: 'MOD',
    args: [new BN(2), new BN(5)],
    result: [new IntegerStackItem(new BN(1))],
    gas: FEES.ONE,
  },
  {
    op: 'SHL',
    args: [new BN(1), new BN(2)],
    result: [new IntegerStackItem(new BN(4))],
    gas: FEES.ONE,
  },
  {
    op: 'SHR',
    args: [new BN(4), new BN(2)],
    result: [new IntegerStackItem(new BN(1))],
    gas: FEES.ONE,
  },
  {
    op: 'BOOLAND',
    args: [true, false],
    result: [new BooleanStackItem(false)],
    gas: FEES.ONE,
  },
  {
    op: 'BOOLOR',
    args: [true, false],
    result: [new BooleanStackItem(true)],
    gas: FEES.ONE,
  },
  {
    op: 'NUMEQUAL',
    args: [new BN(4), new BN(4)],
    result: [new BooleanStackItem(true)],
    gas: FEES.ONE,
  },
  {
    op: 'NUMNOTEQUAL',
    args: [new BN(4), new BN(4)],
    result: [new BooleanStackItem(false)],
    gas: FEES.ONE,
  },
  {
    op: 'LT',
    args: [new BN(4), new BN(5)],
    result: [new BooleanStackItem(false)],
    gas: FEES.ONE,
  },
  {
    op: 'GT',
    args: [new BN(4), new BN(5)],
    result: [new BooleanStackItem(true)],
    gas: FEES.ONE,
  },
  {
    op: 'LTE',
    args: [new BN(4), new BN(4)],
    result: [new BooleanStackItem(true)],
    gas: FEES.ONE,
  },
  {
    op: 'LTE',
    args: [new BN(4), new BN(3)],
    result: [new BooleanStackItem(true)],
    gas: FEES.ONE,
  },
  {
    op: 'GTE',
    args: [new BN(4), new BN(4)],
    result: [new BooleanStackItem(true)],
    gas: FEES.ONE,
  },
  {
    op: 'GTE',
    args: [new BN(4), new BN(3)],
    result: [new BooleanStackItem(false)],
    gas: FEES.ONE,
  },
  {
    op: 'MIN',
    args: [new BN(2), new BN(3)],
    result: [new IntegerStackItem(new BN(2))],
    gas: FEES.ONE,
  },
  {
    op: 'MAX',
    args: [new BN(2), new BN(3)],
    result: [new IntegerStackItem(new BN(3))],
    gas: FEES.ONE,
  },
  {
    op: 'WITHIN',
    args: [new BN(2), new BN(3), new BN(4)],
    result: [new BooleanStackItem(false)],
    gas: FEES.ONE,
  },
  {
    op: 'WITHIN',
    args: [new BN(5), new BN(3), new BN(4)],
    result: [new BooleanStackItem(true)],
    gas: FEES.ONE,
  },
  {
    op: 'SHA1',
    args: [Buffer.alloc(1, 1)],
    result: [new BufferStackItem(crypto.sha1(Buffer.alloc(1, 1)))],
    gas: FEES.TEN,
  },
  {
    op: 'SHA256',
    args: [Buffer.alloc(1, 1)],
    result: [new BufferStackItem(crypto.sha256(Buffer.alloc(1, 1)))],
    gas: FEES.TEN,
  },
  {
    op: 'HASH160',
    args: [Buffer.alloc(20, 1)],
    result: [new UInt160StackItem(crypto.hash160(Buffer.alloc(20, 1)))],
    gas: FEES.TWENTY,
  },
  {
    op: 'HASH256',
    args: [Buffer.alloc(32, 1)],
    result: [new UInt256StackItem(crypto.hash256(Buffer.alloc(32, 1)))],
    gas: FEES.TWENTY,
  },
  // Need to test true condition
  {
    op: 'CHECKSIG',
    args: [keys[0].publicKey, Buffer.alloc(64, 10)],
    result: [new BooleanStackItem(false)],
    gas: FEES.ONE_HUNDRED,
  },
  // {
  //   op: 'CHECKMULTISIG',
  // },
  {
    op: 'ARRAYSIZE',
    args: [[true, false]],
    result: [new IntegerStackItem(new BN(2))],
    gas: FEES.ONE,
  },
  {
    op: 'PACK',
    args: [
      new BN(1),
      Buffer.alloc(1, 0),
      Buffer.alloc(1, 1),
      Buffer.alloc(1, 2),
    ],
    result: [
      new ArrayStackItem([new BufferStackItem(Buffer.alloc(1, 0))]),
      new BufferStackItem(Buffer.alloc(1, 1)),
      new BufferStackItem(Buffer.alloc(1, 2)),
    ],
    gas: FEES.ONE,
  },
  {
    op: 'PACK',
    args: [null],
    result: [new ArrayStackItem([])],
    gas: FEES.ONE,
  },
  // Null case?
  {
    op: 'UNPACK',
    args: [[new BN(4), new BN(5)]],
    result: [
      new IntegerStackItem(new BN(2)),
      new IntegerStackItem(new BN(4)),
      new IntegerStackItem(new BN(5)),
    ],
    gas: FEES.ONE,
  },
  // Need 2nd case for MapStackItem
  {
    op: 'PICKITEM',
    args: [
      new BN(1),
      [Buffer.alloc(1, 0), Buffer.alloc(1, 1), Buffer.alloc(1, 2)],
    ],
    result: [new BufferStackItem(Buffer.alloc(1, 1))],
    gas: FEES.ONE,
  },
  {
    op: 'NEWARRAY',
    args: [new BN(3)],
    result: [
      new ArrayStackItem([
        new BooleanStackItem(false),
        new BooleanStackItem(false),
        new BooleanStackItem(false),
      ]),
    ],
    gas: FEES.ONE,
  },
  {
    op: 'NEWSTRUCT',
    args: [new BN(3)],
    result: [
      new StructStackItem([
        new BooleanStackItem(false),
        new BooleanStackItem(false),
        new BooleanStackItem(false),
      ]),
    ],
    gas: FEES.ONE,
  },
  {
    op: 'NEWMAP',
    result: [new MapStackItem()],
    gas: FEES.ONE,
  },
  // {
  //   op: 'APPEND',
  //   args: [new BN(3), []],
  //   result: [new ArrayStackItem([
  //     new IntegerStackItem(new BN(3))
  //   ])],
  //   gas: FEES.ONE,
  // },
  // {
  //   op: 'REVERSE',
  //   args: []
  // },
  // {
  //   op: 'REMOVE',
  // },
  // {
  //   op: 'HASKEY',
  // },
  // {
  //   op: 'KEYS',
  // },
  // {
  //   op: 'VALUES',
  // },
  // {
  //   op: 'THROW',
  // },
  // {
  //   op: 'THROWIFNOT',
  // },
]: Array<TestCase>);

describe('opcodes', () => {
  for (const testCase of SYSCALLS) {
    const { op, result, gas, buffer, args = [] } = testCase;
    // eslint-disable-next-line
    it(op, async () => {
      const sb = new ScriptBuilder();
      sb.emitOp(op, buffer);
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
      expect(JSON.stringify(context.stack)).toEqual(JSON.stringify(result));
      expect(gasLeft.sub(context.gasLeft).toString(10)).toEqual(
        gas.toString(10),
      );
    });
  }
});
