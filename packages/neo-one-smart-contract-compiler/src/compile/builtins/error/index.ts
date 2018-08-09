import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinValue } from '../BuiltinValue';

class ErrorInterface extends BuiltinInterface {
  public readonly canImplement = true;
}
class ErrorValue extends BuiltinValue {
  public emit(sb: ScriptBuilder, node: ts.Identifier, options: VisitOptions): void {
    // [classVal]
    sb.emitHelper(node, options, sb.helpers.getErrorClass);
  }
}
class ErrorConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('Error', new ErrorInterface());
  builtins.addValue('Error', new ErrorValue());
  builtins.addInterface('ErrorConstructor', new ErrorConstructorInterface());
};
