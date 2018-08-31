import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { BuiltinValueObject } from '../../BuiltinValueObject';
import { AddressFrom } from './from';
import { AddressIsSender } from './isSender';

class AddressInterface extends BuiltinInterface {}
class AddressValue extends BuiltinValueObject {
  public readonly type = 'AddressConstructor';
}
class AddressConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('Address', new AddressInterface());
  builtins.addContractValue('Address', new AddressValue());
  builtins.addContractInterface('AddressConstructor', new AddressConstructorInterface());
  builtins.addContractMember('AddressConstructor', 'from', new AddressFrom());
  builtins.addContractMember('AddressConstructor', 'isSender', new AddressIsSender());
};
