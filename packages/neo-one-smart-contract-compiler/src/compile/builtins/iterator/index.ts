import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';

class IteratorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('Iterator', new IteratorInterface());
};
