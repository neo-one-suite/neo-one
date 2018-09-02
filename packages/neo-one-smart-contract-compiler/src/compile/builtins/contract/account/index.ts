import { Types } from '../../../constants';
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
  builtins.addContractValue('Account', new ValueInstanceOf('AccountConstructor', (sb) => sb.helpers.isAccount));
  builtins.addContractMember(
    'Account',
    'address',
    new SysCallInstanceMemberPrimitive('Neo.Account.GetScriptHash', Types.Account, Types.Buffer),
  );
  builtins.addContractMember('Account', 'getBalance', new AccountGetBalance());
  builtins.addContractInterface('AccountConstructor', new AccountConstructorInterface());
  builtins.addContractMember(
    'AccountConstructor',
    'for',
    new ValueFor('Neo.Blockchain.GetAccount', (sb, node, options) => {
      sb.emitHelper(node, options, sb.helpers.wrapAccount);
    }),
  );
};
