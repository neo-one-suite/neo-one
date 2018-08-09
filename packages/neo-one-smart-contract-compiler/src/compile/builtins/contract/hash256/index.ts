import { common } from '@neo-one/client-core';
import { BuiltinBase } from '../../BuiltinBase';
import { BuiltinConstantBufferMemberValue } from '../../BuiltinConstantBufferMemberValue';
import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { Hash256From } from './from';

class Hash256Interface extends BuiltinInterface {}
class Hash256Value extends BuiltinBase {}
class Hash256ConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('Hash256', new Hash256Interface());
  builtins.addContractValue('Hash256', new Hash256Value());
  builtins.addContractInterface('Hash256Constructor', new Hash256ConstructorInterface());
  builtins.addContractMember('Hash256Constructor', 'from', new Hash256From());
  builtins.addContractMember(
    'Hash256Constructor',
    'NEO',
    new BuiltinConstantBufferMemberValue(common.stringToUInt256(common.NEO_ASSET_HASH)),
  );
  builtins.addContractMember(
    'Hash256Constructor',
    'GAS',
    new BuiltinConstantBufferMemberValue(common.stringToUInt256(common.GAS_ASSET_HASH)),
  );
};
