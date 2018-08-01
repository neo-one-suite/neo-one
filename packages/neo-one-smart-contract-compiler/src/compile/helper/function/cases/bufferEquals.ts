import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { SpecialCase } from './types';

export const bufferEquals: SpecialCase = {
  test: (sb, node, symbol) => sb.isGlobalSymbol(node, symbol, 'BufferEquals'),
  handle: (sb, node, optionsIn) => {
    const func = tsUtils.expression.getExpression(node);
    if (!ts.isPropertyAccessExpression(func)) {
      sb.reportUnsupported(node);

      return;
    }

    const args = tsUtils.argumented.getArguments(node);
    if (args.length !== 1) {
      sb.reportUnsupported(node);

      return;
    }

    const options = sb.pushValueOptions(optionsIn);

    const lhs = tsUtils.expression.getExpression(func);
    // [bufferVal]
    sb.visit(lhs, options);
    // [buffer]
    sb.emitHelper(node, options, sb.helpers.unwrapBuffer);
    // [bufferVal, buffer]
    sb.visit(args[0], options);
    // [buffer, buffer]
    sb.emitHelper(node, options, sb.helpers.unwrapBuffer);
    // [boolean]
    sb.emitOp(node, 'EQUAL');
    // [booleanVal]
    sb.emitHelper(node, options, sb.helpers.createBoolean);

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  },
};
