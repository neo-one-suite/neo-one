import { BuiltinBase } from '../../BuiltinBase';
import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { SmartContractFor } from './for';

class SmartContractInterface extends BuiltinInterface {
  public readonly canImplement = true;
}
class SmartContractValue extends BuiltinBase {}
class SmartContractConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('SmartContract', new SmartContractInterface());
  builtins.addContractValue('SmartContract', new SmartContractValue());
  builtins.addContractInterface('SmartContractConstructor', new SmartContractConstructorInterface());
  builtins.addContractMember('SmartContractConstructor', 'for', new SmartContractFor());
};
