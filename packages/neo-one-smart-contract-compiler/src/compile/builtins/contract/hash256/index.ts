import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { BuiltinValueObject } from '../../BuiltinValueObject';
import { Hash256From } from './from';

class Hash256Interface extends BuiltinInterface {}
class Hash256Value extends BuiltinValueObject {
  public readonly type = 'Hash256Constructor';
}
class Hash256ConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('Hash256', new Hash256Interface());
  builtins.addContractValue('Hash256', new Hash256Value());
  builtins.addContractInterface('Hash256Constructor', new Hash256ConstructorInterface());
  builtins.addContractMember('Hash256Constructor', 'from', new Hash256From());
};
