import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinValueObject } from '../BuiltinValueObject';

class RegExpInterface extends BuiltinInterface {}
class RegExpValue extends BuiltinValueObject {
  public readonly type = 'RegExpConstructor';
}
class RegExpConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('RegExp', new RegExpInterface());
  builtins.addValue('RegExp', new RegExpValue());
  builtins.addInterface('RegExpConstructor', new RegExpConstructorInterface());
};
