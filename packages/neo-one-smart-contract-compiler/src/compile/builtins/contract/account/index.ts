import { Types } from '../../../helper/types/Types';
import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { SysCallInstanceMemberPrimitive } from '../SysCallInstanceMemberPrimitive';
import { ValueFor } from '../ValueFor';
import { ValueInstanceOf } from '../ValueInstanceOf';
import { AccountGetBalance } from './getBalance';

class AccountInterface extends BuiltinInterface {}
class AccountConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('Account', new AccountInterface());
  builtins.addContractValue('Account', new ValueInstanceOf((sb) => sb.helpers.isAccount));
  builtins.addContractMember(
    'Account',
    'hash',
    new SysCallInstanceMemberPrimitive('Neo.Account.GetScriptHash', Types.Account, Types.Buffer),
  );
  builtins.addContractMember('Account', 'getBalance', new AccountGetBalance());
  builtins.addContractInterface('AccountConstructor', new AccountConstructorInterface());
  builtins.addContractMember(
    'AccountConstructor',
    'for',
    new ValueFor('Neo.Blockchain.GetAccount', (sb) => sb.helpers.wrapAccount),
  );
};
