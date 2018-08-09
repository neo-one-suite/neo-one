import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinValue } from '../BuiltinValue';

class SetStorageInterface extends BuiltinInterface {}
class SetStorageValue extends BuiltinValue {
  public emit(sb: ScriptBuilder, node: ts.Identifier, options: VisitOptions): void {
    // [classVal]
    sb.emitHelper(node, options, sb.helpers.getSetStorageClass);
  }
}
class SetStorageConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('SetStorage', new SetStorageInterface());
  builtins.addContractValue('SetStorage', new SetStorageValue());
  builtins.addContractInterface('SetStorageConstructor', new SetStorageConstructorInterface());
};
