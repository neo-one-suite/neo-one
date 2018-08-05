import ts from 'typescript';
import { Context } from '../../../Context';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Builtins } from '../Builtins';
import { BuiltinBase, BuiltinType, BuiltinValue } from '../types';

class ErrorInstance extends BuiltinBase implements BuiltinValue {
  public readonly canImplement = true;
  public readonly types = new Set([BuiltinType.Value]);

  public emitValue(sb: ScriptBuilder, node: ts.Identifier, options: VisitOptions): void {
    // [classVal]
    sb.emitHelper(node, options, sb.helpers.getErrorClass);
  }
}
class ErrorConstructor extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (context: Context, builtins: Builtins): void => {
  builtins.addInterface(context, 'Error', new ErrorInstance());
  builtins.addValue(context, 'Error', new ErrorInstance());
  builtins.addInterface(context, 'ErrorConstructor', new ErrorConstructor());
};
