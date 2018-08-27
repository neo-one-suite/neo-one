import { BuiltinBase } from '../../BuiltinBase';
import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { AddressFrom } from './from';
import { AddressIsSender } from './isSender';

class AddressInterface extends BuiltinInterface {}
class AddressValue extends BuiltinBase {}
class AddressConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('Address', new AddressInterface());
  builtins.addContractValue('Address', new AddressValue());
  builtins.addContractInterface('AddressConstructor', new AddressConstructorInterface());
  builtins.addContractMember('AddressConstructor', 'from', new AddressFrom());
  builtins.addContractMember('AddressConstructor', 'isSender', new AddressIsSender());
};
