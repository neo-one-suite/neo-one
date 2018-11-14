import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinValueObject } from '../BuiltinValueObject';

class FunctionInterface extends BuiltinInterface {}
class FunctionValue extends BuiltinValueObject {
  public readonly type = 'FunctionConstructor';
}
class FunctionConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('Function', new FunctionInterface());
  builtins.addValue('Function', new FunctionValue());
  builtins.addInterface('FunctionConstructor', new FunctionConstructorInterface());
};
