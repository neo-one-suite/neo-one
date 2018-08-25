import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { BuiltinValueObject } from '../../BuiltinValueObject';
import { DeploySenderAddress } from './senderAddress';

class DeployValue extends BuiltinValueObject {
  public readonly type = 'DeployConstructor';
}
class DeployConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractValue('Deploy', new DeployValue());
  builtins.addContractInterface('DeployConstructor', new DeployConstructorInterface());
  builtins.addContractMember('DeployConstructor', 'senderAddress', new DeploySenderAddress());
};
