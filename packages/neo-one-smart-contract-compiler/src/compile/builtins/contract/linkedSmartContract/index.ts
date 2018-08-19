import { BuiltinBase } from '../../BuiltinBase';
import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { LinkedSmartContractFor } from './for';

class LinkedSmartContractInterface extends BuiltinInterface {}
class LinkedSmartContractValue extends BuiltinBase {}
class LinkedSmartContractConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('LinkedSmartContract', new LinkedSmartContractInterface());
  builtins.addContractValue('LinkedSmartContract', new LinkedSmartContractValue());
  builtins.addContractInterface('LinkedSmartContractConstructor', new LinkedSmartContractConstructorInterface());
  builtins.addContractMember('LinkedSmartContractConstructor', 'for', new LinkedSmartContractFor());
};
