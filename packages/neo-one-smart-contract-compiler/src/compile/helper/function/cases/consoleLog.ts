import { ABIReturn } from '@neo-one/client';
import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { toABIReturn } from '../../../../utils';
import { SpecialCase } from './types';

export const consoleLog: SpecialCase = {
  test: (sb, node, symbol) => sb.isGlobalSymbol(node, symbol, 'consoleLog'),
  handle: (sb, node, optionsIn) => {
    const options = sb.pushValueOptions(optionsIn);

    const emitABIReturn = (abiReturn: ABIReturn, arg: ts.Expression): number => {
      switch (abiReturn.type) {
        case 'Signature':
        case 'Hash160':
        case 'Hash256':
        case 'PublicKey':
        case 'ByteArray':
        case 'String':
        case 'Integer':
        case 'Boolean':
          // [val]
          sb.visit(arg, options);
          // tslint:disable-next-line prefer-switch
          if (abiReturn.type === 'String' || abiReturn.type === 'Integer' || abiReturn.type === 'Boolean') {
            // [value]
            sb.emitHelper(arg, options, sb.helpers.unwrapVal);
          } else {
            sb.emitHelper(arg, options, sb.helpers.unwrapBuffer);
          }
          // [type, value]
          sb.emitPushString(arg, abiReturn.type);
          // [2, type, value]
          sb.emitPushInt(arg, 2);
          // [[type, value]]
          sb.emitOp(arg, 'PACK');

          return 1;
        case 'Array':
        case 'Void':
        case 'InteropInterface':
          sb.reportUnsupported(arg);

          return 0;
        default:
          utils.assertNever(abiReturn);
          sb.reportUnsupported(arg);

          return 0;
      }
    };

    const encodeValue = (arg: ts.Expression): number => {
      const type = sb.getType(arg, { error: true });
      if (type === undefined) {
        return 0;
      }

      const abiReturn = toABIReturn(sb.context, arg, type);
      if (abiReturn === undefined) {
        sb.reportUnsupported(arg);

        return 0;
      }

      return emitABIReturn(abiReturn, arg);
    };

    const args = tsUtils.argumented.getArguments(node);
    const argsLength = args.reduce((acc, arg) => acc + encodeValue(arg), 0);
    // [length, ...arr]
    sb.emitPushInt(node, argsLength);
    // [arr]
    sb.emitOp(node, 'PACK');
    // [line, arr]
    sb.emitLine(node);
    // ['console.log', line, arr]
    sb.emitPushString(node, 'console.log');
    // [length, 'console.log', line, arr]
    sb.emitPushInt(node, 3);
    // [arr]
    sb.emitOp(node, 'PACK');
    // []
    sb.emitSysCall(node, 'Neo.Runtime.Notify');
  },
};
