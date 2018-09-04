import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { BuiltinValueObject } from '../../BuiltinValueObject';
import { LinkedSmartContractFor } from './for';

class LinkedSmartContractValue extends BuiltinValueObject {
  public readonly type = 'LinkedSmartContractConstructor';
}
class LinkedSmartContractConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractValue('LinkedSmartContract', new LinkedSmartContractValue());
  builtins.addContractInterface('LinkedSmartContractConstructor', new LinkedSmartContractConstructorInterface());
  builtins.addContractMember('LinkedSmartContractConstructor', 'for', new LinkedSmartContractFor());
};
