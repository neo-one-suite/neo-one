import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinValueObject } from '../BuiltinValueObject';
import { SymbolFor } from './for';
import { SymbolIterator } from './iterator';
import { SymbolToPrimitive } from './toPrimitive';

class SymbolInterface extends BuiltinInterface {}
class SymbolValue extends BuiltinValueObject {
  public readonly type = 'SymbolConstructor';
}
class SymbolConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('Symbol', new SymbolInterface());
  builtins.addValue('Symbol', new SymbolValue());
  builtins.addInterface('SymbolConstructor', new SymbolConstructorInterface());
  builtins.addMember('SymbolConstructor', 'for', new SymbolFor());
  builtins.addMember('SymbolConstructor', 'iterator', new SymbolIterator());
  builtins.addMember('SymbolConstructor', 'toPrimitive', new SymbolToPrimitive());
};
