import ts from 'typescript';
import { WellKnownSymbol } from '../../helper/types/WellKnownSymbol';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInMemberValue, BuiltInType } from '../types';

// tslint:disable-next-line export-name
export abstract class WellKnownSymbolBase extends BuiltInBase implements BuiltInMemberValue {
  public readonly types = new Set([BuiltInType.MemberValue]);
  protected abstract readonly symbol: WellKnownSymbol;
  public emitValue(
    sb: ScriptBuilder,
    node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
    options: VisitOptions,
  ): void {
    // [string]
    sb.emitPushString(node, this.symbol);
    // [symbolVal]
    sb.emitHelper(node, options, sb.helpers.createSymbol);
  }
}
