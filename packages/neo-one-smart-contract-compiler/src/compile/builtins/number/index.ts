import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinValueObject } from '../BuiltinValueObject';

class NumberInterface extends BuiltinInterface {}
class NumberValue extends BuiltinValueObject {
  public readonly type = 'NumberConstructor';
}
class NumberConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('Number', new NumberInterface());
  builtins.addValue('Number', new NumberValue());
  builtins.addInterface('NumberConstructor', new NumberConstructorInterface());
};
