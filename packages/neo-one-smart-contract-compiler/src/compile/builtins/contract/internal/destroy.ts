import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { BuiltinCall } from '../../BuiltinCall';

// tslint:disable-next-line export-name
export class Destroy extends BuiltinCall {
  public emitCall(sb: ScriptBuilder, node: ts.CallExpression): void {
    // []
    sb.emitSysCall(node, 'Neo.Contract.Destroy');
  }
}
