import ts from 'typescript';
import { WellKnownSymbol } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinMemberValue } from '../BuiltinMemberValue';

type Node = ts.PropertyAccessExpression | ts.ElementAccessExpression;

// tslint:disable-next-line export-name
export abstract class WellKnownSymbolBase extends BuiltinMemberValue {
  protected abstract readonly symbol: WellKnownSymbol;

  protected emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (options.pushValue) {
      // [string]
      sb.emitPushString(node, this.symbol);
      // [symbolVal]
      sb.emitHelper(node, options, sb.helpers.wrapSymbol);
    }
  }
}
