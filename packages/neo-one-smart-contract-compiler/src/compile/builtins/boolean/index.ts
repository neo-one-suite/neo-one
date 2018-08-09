import { BuiltinBase } from '../BuiltinBase';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';

class BooleanInterface extends BuiltinInterface {}
class BooleanValue extends BuiltinBase {}
class BooleanConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('Boolean', new BooleanInterface());
  builtins.addValue('Boolean', new BooleanValue());
  builtins.addInterface('BooleanConstructor', new BooleanConstructorInterface());
};
