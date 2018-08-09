import { BuiltinBase } from '../../BuiltinBase';
import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { PublicKeyFrom } from './from';

class PublicKeyInterface extends BuiltinInterface {}
class PublicKeyValue extends BuiltinBase {}
class PublicKeyConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('PublicKey', new PublicKeyInterface());
  builtins.addContractValue('PublicKey', new PublicKeyValue());
  builtins.addContractInterface('PublicKeyConstructor', new PublicKeyConstructorInterface());
  builtins.addContractMember('PublicKeyConstructor', 'from', new PublicKeyFrom());
};
