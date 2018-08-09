import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinValue } from '../BuiltinValue';

class MapStorageInterface extends BuiltinInterface {}
class MapStorageValue extends BuiltinValue {
  public emit(sb: ScriptBuilder, node: ts.Identifier, options: VisitOptions): void {
    // [classVal]
    sb.emitHelper(node, options, sb.helpers.getMapStorageClass);
  }
}
class MapStorageConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('MapStorage', new MapStorageInterface());
  builtins.addContractValue('MapStorage', new MapStorageValue());
  builtins.addContractInterface('MapStorageConstructor', new MapStorageConstructorInterface());
};
