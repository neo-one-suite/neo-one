import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInCall, BuiltInType } from '../types';

// tslint:disable-next-line export-name
export class SymbolFor extends BuiltInBase implements BuiltInCall {
  public readonly types = new Set([BuiltInType.Call]);
  public emitCall(sb: ScriptBuilder, node: ts.CallExpression, options: VisitOptions): void {
    const arg = tsUtils.argumented.getArguments(node)[0];
    // [stringVal]
    sb.visit(arg, sb.pushValueOptions(options));
    // [string]
    sb.emitHelper(arg, sb.pushValueOptions(options), sb.helpers.toString({ type: sb.getType(arg) }));
    // [symbolVal]
    sb.emitHelper(node, options, sb.helpers.createSymbol);
  }
}
