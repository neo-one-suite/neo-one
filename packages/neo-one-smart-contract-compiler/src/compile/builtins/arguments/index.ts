import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';

class ArgumentsInstance extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('IArguments', new ArgumentsInstance());
};
