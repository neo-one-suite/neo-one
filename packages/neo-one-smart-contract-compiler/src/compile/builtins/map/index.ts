import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinValue } from '../BuiltinValue';

class MapInterface extends BuiltinInterface {
  public readonly canImplement = true;
}
class MapValue extends BuiltinValue {
  public emit(sb: ScriptBuilder, node: ts.Identifier, options: VisitOptions): void {
    // [classVal]
    sb.emitHelper(node, options, sb.helpers.getMapClass);
  }
}
class MapConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('Map', new MapInterface());
  builtins.addValue('Map', new MapValue());
  builtins.addInterface('MapConstructor', new MapConstructorInterface());
};
