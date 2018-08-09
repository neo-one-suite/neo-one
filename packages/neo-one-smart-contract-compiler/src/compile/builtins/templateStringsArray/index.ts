import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';

class TemplateStringsArrayInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('TemplateStringsArray', new TemplateStringsArrayInterface());
};
