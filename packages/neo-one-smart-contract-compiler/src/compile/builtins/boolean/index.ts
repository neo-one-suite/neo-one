import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinValueObject } from '../BuiltinValueObject';

class BooleanInterface extends BuiltinInterface {}
class BooleanValue extends BuiltinValueObject {
  public readonly type = 'BooleanConstructor';
}
class BooleanConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('Boolean', new BooleanInterface());
  builtins.addValue('Boolean', new BooleanValue());
  builtins.addInterface('BooleanConstructor', new BooleanConstructorInterface());
};
