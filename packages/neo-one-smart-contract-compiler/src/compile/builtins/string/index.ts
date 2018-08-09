import { BuiltinBase } from '../BuiltinBase';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';

class StringInterface extends BuiltinInterface {}
class StringValue extends BuiltinBase {}
class StringConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('String', new StringInterface());
  builtins.addValue('String', new StringValue());
  builtins.addInterface('StringConstructor', new StringConstructorInterface());
};
