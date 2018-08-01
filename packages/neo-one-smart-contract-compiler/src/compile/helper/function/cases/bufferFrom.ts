import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { SpecialCase } from './types';

export const bufferFrom: SpecialCase = {
  test: (sb, node, symbol) => sb.isGlobalSymbol(node, symbol, 'BufferFrom'),
  handle: (sb, node, options) => {
    const args = tsUtils.argumented.getArguments(node);
    if (args.length !== 2) {
      sb.reportUnsupported(node);

      return;
    }

    const hash = args[0];
    const encoding = args[1];
    if (!ts.isStringLiteral(hash) || !ts.isStringLiteral(encoding)) {
      sb.reportUnsupported(node);

      return;
    }

    if (options.pushValue) {
      sb.emitPushBuffer(
        node,
        Buffer.from(tsUtils.literal.getLiteralValue(hash), tsUtils.literal.getLiteralValue(encoding)),
      );
      sb.emitHelper(node, options, sb.helpers.wrapBuffer);
    }
  },
};
