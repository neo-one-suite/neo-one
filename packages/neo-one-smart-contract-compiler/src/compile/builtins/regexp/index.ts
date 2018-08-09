import { BuiltinBase } from '../BuiltinBase';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';

class RegExpInterface extends BuiltinInterface {}
class RegExpValue extends BuiltinBase {}
class RegExpConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('RegExp', new RegExpInterface());
  builtins.addValue('RegExp', new RegExpValue());
  builtins.addInterface('RegExpConstructor', new RegExpConstructorInterface());
};
