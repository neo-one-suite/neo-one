import { BuiltinBase } from '../BuiltinBase';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';

class FunctionInterface extends BuiltinInterface {}
class FunctionValue extends BuiltinBase {}
class FunctionConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('Function', new FunctionInterface());
  builtins.addValue('Function', new FunctionValue());
  builtins.addInterface('FunctionConstructor', new FunctionConstructorInterface());
};
