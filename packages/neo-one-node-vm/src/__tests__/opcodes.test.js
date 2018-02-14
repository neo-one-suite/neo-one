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
} from '@neo-one/client-core';
import BN from 'bn.js';

import { type StackItem, BufferStackItem } from '../stackItem';

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
|};

const SYSCALLS = ([
  {
    op: 'PUSH0',
    result: [new BufferStackItem(Buffer.from([]))],
    gas: utils.ZERO,
  },
  {
    op: 'PUSHBYTES1',
    buffer: Buffer.from([10]),
    result: [new BufferStackItem(Buffer.from([10]))],
    gas: utils.ZERO,
  },
  // {
  //   op: 'PUSHBYTES2',
  // },
  // {
  //   op: 'PUSHBYTES3',
  // },
  // {
  //   op: 'PUSHBYTES4',
  // },
  // {
  //   op: 'PUSHBYTES5',
  // },
  // {
  //   op: 'PUSHBYTES6',
  // },
  // {
  //   op: 'PUSHBYTES7',
  // },
  // {
  //   op: 'PUSHBYTES8',
  // },
  // {
  //   op: 'PUSHBYTES9',
  // },
  // {
  //   op: 'PUSHBYTES10',
  // },
  // {
  //   op: 'PUSHBYTES11',
  // },
  // {
  //   op: 'PUSHBYTES12',
  // },
  // {
  //   op: 'PUSHBYTES13',
  // },
  // {
  //   op: 'PUSHBYTES14',
  // },
  // {
  //   op: 'PUSHBYTES15',
  // },
  // {
  //   op: 'PUSHBYTES16',
  // },
  // {
  //   op: 'PUSHBYTES17',
  // },
  // {
  //   op: 'PUSHBYTES18',
  // },
  // {
  //   op: 'PUSHBYTES19',
  // },
  // {
  //   op: 'PUSHBYTES20',
  // },
  // {
  //   op: 'PUSHBYTES21',
  // },
  // {
  //   op: 'PUSHBYTES22',
  // },
  // {
  //   op: 'PUSHBYTES23',
  // },
  // {
  //   op: 'PUSHBYTES24',
  // },
  // {
  //   op: 'PUSHBYTES25',
  // },
  // {
  //   op: 'PUSHBYTES26',
  // },
  // {
  //   op: 'PUSHBYTES27',
  // },
  // {
  //   op: 'PUSHBYTES28',
  // },
  // {
  //   op: 'PUSHBYTES29',
  // },
  // {
  //   op: 'PUSHBYTES30',
  // },
  // {
  //   op: 'PUSHBYTES31',
  // },
  // {
  //   op: 'PUSHBYTES32',
  // },
  // {
  //   op: 'PUSHBYTES33',
  // },
  // {
  //   op: 'PUSHBYTES34',
  // },
  // {
  //   op: 'PUSHBYTES35',
  // },
  // {
  //   op: 'PUSHBYTES36',
  // },
  // {
  //   op: 'PUSHBYTES37',
  // },
  // {
  //   op: 'PUSHBYTES38',
  // },
  // {
  //   op: 'PUSHBYTES39',
  // },
  // {
  //   op: 'PUSHBYTES40',
  // },
  // {
  //   op: 'PUSHBYTES41',
  // },
  // {
  //   op: 'PUSHBYTES42',
  // },
  // {
  //   op: 'PUSHBYTES43',
  // },
  // {
  //   op: 'PUSHBYTES44',
  // },
  // {
  //   op: 'PUSHBYTES45',
  // },
  // {
  //   op: 'PUSHBYTES46',
  // },
  // {
  //   op: 'PUSHBYTES47',
  // },
  // {
  //   op: 'PUSHBYTES48',
  // },
  // {
  //   op: 'PUSHBYTES49',
  // },
  // {
  //   op: 'PUSHBYTES50',
  // },
  // {
  //   op: 'PUSHBYTES51',
  // },
  // {
  //   op: 'PUSHBYTES52',
  // },
  // {
  //   op: 'PUSHBYTES53',
  // },
  // {
  //   op: 'PUSHBYTES54',
  // },
  // {
  //   op: 'PUSHBYTES55',
  // },
  // {
  //   op: 'PUSHBYTES56',
  // },
  // {
  //   op: 'PUSHBYTES57',
  // },
  // {
  //   op: 'PUSHBYTES58',
  // },
  // {
  //   op: 'PUSHBYTES59',
  // },
  // {
  //   op: 'PUSHBYTES60',
  // },
  // {
  //   op: 'PUSHBYTES61',
  // },
  // {
  //   op: 'PUSHBYTES62',
  // },
  // {
  //   op: 'PUSHBYTES63',
  // },
  // {
  //   op: 'PUSHBYTES64',
  // },
  // {
  //   op: 'PUSHBYTES65',
  // },
  // {
  //   op: 'PUSHBYTES66',
  // },
  // {
  //   op: 'PUSHBYTES67',
  // },
  // {
  //   op: 'PUSHBYTES68',
  // },
  // {
  //   op: 'PUSHBYTES69',
  // },
  // {
  //   op: 'PUSHBYTES70',
  // },
  // {
  //   op: 'PUSHBYTES71',
  // },
  // {
  //   op: 'PUSHBYTES72',
  // },
  // {
  //   op: 'PUSHBYTES73',
  // },
  // {
  //   op: 'PUSHBYTES75',
  // },
  // {
  //   op: 'PUSHDATA1',
  // },
  // {
  //   op: 'PUSHDATA2',
  // },
  // {
  //   op: 'PUSHDATA4',
  // },
  // {
  //   op: 'PUSHM1',
  // },
  // {
  //   op: 'PUSH1',
  // },
  // {
  //   op: 'PUSH2',
  // },
  // {
  //   op: 'PUSH3',
  // },
  // {
  //   op: 'PUSH4',
  // },
  // {
  //   op: 'PUSH5',
  // },
  // {
  //   op: 'PUSH6',
  // },
  // {
  //   op: 'PUSH7',
  // },
  // {
  //   op: 'PUSH8',
  // },
  // {
  //   op: 'PUSH9',
  // },
  // {
  //   op: 'PUSH10',
  // },
  // {
  //   op: 'PUSH11',
  // },
  // {
  //   op: 'PUSH12',
  // },
  // {
  //   op: 'PUSH13',
  // },
  // {
  //   op: 'PUSH14',
  // },
  // {
  //   op: 'PUSH15',
  // },
  // {
  //   op: 'PUSH16',
  // },
  // {
  //   op: 'NOP',
  // },
  // {
  //   op: 'JMP',
  // },
  // {
  //   op: 'JMPIF',
  // },
  // {
  //   op: 'JMPIFNOT',
  // },
  // {
  //   op: 'CALL',
  // },
  // {
  //   op: 'RET',
  // },
  // {
  //   op: 'APPCALL',
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
  // {
  //   op: 'XDROP',
  // },
  // {
  //   op: 'XSWAP',
  // },
  // {
  //   op: 'XTUCK',
  // },
  // {
  //   op: 'DEPTH',
  // },
  // {
  //   op: 'DROP',
  // },
  // {
  //   op: 'DUP',
  // },
  // {
  //   op: 'NIP',
  // },
  // {
  //   op: 'OVER',
  // },
  // {
  //   op: 'PICK',
  // },
  // {
  //   op: 'ROLL',
  // },
  // {
  //   op: 'ROT',
  // },
  // {
  //   op: 'SWAP',
  // },
  // {
  //   op: 'TUCK',
  // },
  // {
  //   op: 'CAT',
  // },
  // {
  //   op: 'SUBSTR',
  // },
  // {
  //   op: 'LEFT',
  // },
  // {
  //   op: 'RIGHT',
  // },
  // {
  //   op: 'SIZE',
  // },
  // {
  //   op: 'INVERT',
  // },
  // {
  //   op: 'AND',
  // },
  // {
  //   op: 'OR',
  // },
  // {
  //   op: 'XOR',
  // },
  // {
  //   op: 'EQUAL',
  // },
  // {
  //   op: 'OP_EQUALVERIFY',
  // },
  // {
  //   op: 'OP_RESERVED1',
  // },
  // {
  //   op: 'OP_RESERVED2',
  // },
  // {
  //   op: 'INC',
  // },
  // {
  //   op: 'DEC',
  // },
  // {
  //   op: 'SIGN',
  // },
  // {
  //   op: 'NEGATE',
  // },
  // {
  //   op: 'ABS',
  // },
  // {
  //   op: 'NOT',
  // },
  // {
  //   op: 'NZ',
  // },
  // {
  //   op: 'ADD',
  // },
  // {
  //   op: 'SUB',
  // },
  // {
  //   op: 'MUL',
  // },
  // {
  //   op: 'DIV',
  // },
  // {
  //   op: 'MOD',
  // },
  // {
  //   op: 'SHL',
  // },
  // {
  //   op: 'SHR',
  // },
  // {
  //   op: 'BOOLAND',
  // },
  // {
  //   op: 'BOOLOR',
  // },
  // {
  //   op: 'NUMEQUAL',
  // },
  // {
  //   op: 'NUMNOTEQUAL',
  // },
  // {
  //   op: 'LT',
  // },
  // {
  //   op: 'GT',
  // },
  // {
  //   op: 'LTE',
  // },
  // {
  //   op: 'GTE',
  // },
  // {
  //   op: 'MIN',
  // },
  // {
  //   op: 'MAX',
  // },
  // {
  //   op: 'WITHIN',
  // },
  // {
  //   op: 'SHA1',
  // },
  // {
  //   op: 'SHA256',
  // },
  // {
  //   op: 'HASH160',
  // },
  // {
  //   op: 'HASH256',
  // },
  // {
  //   op: 'CHECKSIG',
  // },
  // {
  //   op: 'CHECKMULTISIG',
  // },
  // {
  //   op: 'ARRAYSIZE',
  // },
  // {
  //   op: 'PACK',
  // },
  // {
  //   op: 'UNPACK',
  // },
  // {
  //   op: 'PICKITEM',
  // },
  // {
  //   op: 'SETITEM',
  // },
  // {
  //   op: 'NEWARRAY',
  // },
  // {
  //   op: 'NEWSTRUCT',
  // },
  // {
  //   op: 'NEWMAP',
  // },
  // {
  //   op: 'APPEND',
  // },
  // {
  //   op: 'REVERSE',
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
      expect(context.stack).toEqual(result);
      expect(gasLeft.sub(context.gasLeft).toString(10)).toEqual(
        gas.toString(10),
      );
    });
  }
});
