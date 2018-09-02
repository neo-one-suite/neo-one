import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinValueObject } from '../BuiltinValueObject';

class StringInterface extends BuiltinInterface {}
class StringValue extends BuiltinValueObject {
  public readonly type = 'StringConstructor';
}
class StringConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('String', new StringInterface());
  builtins.addValue('String', new StringValue());
  builtins.addInterface('StringConstructor', new StringConstructorInterface());
};
