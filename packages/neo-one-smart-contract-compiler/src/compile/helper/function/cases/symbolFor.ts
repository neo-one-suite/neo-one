import { tsUtils } from '@neo-one/ts-utils';
import { SpecialCase } from './types';

export const symbolFor: SpecialCase = {
  test: (sb, node, symbol) => sb.isGlobalSymbol(node, symbol, 'SymbolFor'),
  handle: (sb, node, optionsIn) => {
    const options = sb.pushValueOptions(optionsIn);
    const args = tsUtils.argumented.getArguments(node);
    // [stringVal]
    sb.visit(args[0], options);
    if (optionsIn.pushValue) {
      // [string]
      sb.emitHelper(node, options, sb.helpers.toString({ type: sb.getType(args[0]) }));
      // [symbolVal]
      sb.emitHelper(node, options, sb.helpers.createSymbol);
    } else {
      sb.emitOp(node, 'DROP');
    }
  },
};
