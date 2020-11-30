import { common } from '@neo-one/client-common';
import { BuiltinConstantBufferMemberValue } from '../../BuiltinConstantBufferMemberValue';
import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { BuiltinValueObject } from '../../BuiltinValueObject';
import { Hash160From } from './from';

class Hash160Interface extends BuiltinInterface {}
class Hash160Value extends BuiltinValueObject {
  public readonly type = 'Hash160Constructor';
}
class Hash160ConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('Hash160', new Hash160Interface());
  builtins.addContractValue('Hash160', new Hash160Value());
  builtins.addContractInterface('Hash160Constructor', new Hash160ConstructorInterface());
  builtins.addContractMember('Hash160Constructor', 'from', new Hash160From());
  builtins.addContractMember(
    'Hash160Constructor',
    'NEO',
    new BuiltinConstantBufferMemberValue(common.nativeHashes.NEO),
  );
  builtins.addContractMember(
    'Hash160Constructor',
    'GAS',
    new BuiltinConstantBufferMemberValue(common.nativeHashes.GAS),
  );
  builtins.addContractMember(
    'Hash160Constructor',
    'Policy',
    new BuiltinConstantBufferMemberValue(common.nativeHashes.Policy),
  );
};
