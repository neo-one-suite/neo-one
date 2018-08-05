import ts from 'typescript';
import { WellKnownSymbol } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinBase, BuiltinMemberValue, BuiltinType } from '../types';

type Node = ts.PropertyAccessExpression | ts.ElementAccessExpression;

// tslint:disable-next-line export-name
export abstract class WellKnownSymbolBase extends BuiltinBase implements BuiltinMemberValue {
  public readonly types = new Set([BuiltinType.MemberValue]);
  protected abstract readonly symbol: WellKnownSymbol;
  public emitValue(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    // [string]
    sb.emitPushString(node, this.symbol);
    // [symbolVal]
    sb.emitHelper(node, options, sb.helpers.createSymbol);
  }
}
