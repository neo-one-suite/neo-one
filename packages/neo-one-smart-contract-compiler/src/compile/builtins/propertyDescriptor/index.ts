import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';

class PropertyDescriptorInterface extends BuiltinInterface {
  public readonly canImplement = true;
}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('PropertyDescriptor', new PropertyDescriptorInterface());
};
