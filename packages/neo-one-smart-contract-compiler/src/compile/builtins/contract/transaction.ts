import { Types } from '../../constants';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinInstanceIndexValue } from './BuiltinInstanceIndexValue';
import { SysCallInstanceMemberIndex } from './SysCallInstanceMemberIndex';
import { SysCallInstanceMemberPrimitive } from './SysCallInstanceMemberPrimitive';
import { ValueFor } from './ValueFor';
import { ValueInstanceOf } from './ValueInstanceOf';

class TransactionInterface extends BuiltinInterface {}
class TransactionConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('Transaction', new TransactionInterface());
  builtins.addContractInterface('TransactionConstructor', new TransactionConstructorInterface());
  builtins.addContractValue(
    'Transaction',
    new ValueInstanceOf('TransactionConstructor', (sb) => sb.helpers.isTransaction),
  );
  builtins.addContractMember(
    'Transaction',
    'height',
    new SysCallInstanceMemberIndex('System.Blockchain.GetTransactionHeight', 0, Types.Transaction, Types.Number),
  );
  builtins.addContractMember('Transaction', 'hash', new BuiltinInstanceIndexValue(0, Types.Transaction, Types.Buffer));
  builtins.addContractMember(
    'Transaction',
    'version',
    new BuiltinInstanceIndexValue(1, Types.Transaction, Types.Number),
  );
  builtins.addContractMember('Transaction', 'nonce', new BuiltinInstanceIndexValue(2, Types.Transaction, Types.Number));
  builtins.addContractMember(
    'Transaction',
    'sender',
    new BuiltinInstanceIndexValue(3, Types.Transaction, Types.Buffer),
  );
  builtins.addContractMember(
    'Transaction',
    'systemFee',
    new BuiltinInstanceIndexValue(4, Types.Transaction, Types.Number),
  );
  builtins.addContractMember(
    'Transaction',
    'networkFee',
    new BuiltinInstanceIndexValue(5, Types.Transaction, Types.Number),
  );
  builtins.addContractMember(
    'Transaction',
    'validUntilBlock',
    new BuiltinInstanceIndexValue(6, Types.Transaction, Types.Number),
  );
  builtins.addContractMember(
    'Transaction',
    'script',
    new BuiltinInstanceIndexValue(7, Types.Transaction, Types.Buffer),
  );
  // TODO: notification is an array stack item which needs to be split up by index
  // Need to input a Hash160 to get the notification
  // Hash160 is script hash? SHA160 the script?
  // builtins.addContractMember(
  //   'Transaction',
  //   'notifications',
  //   new SysCallInstanceMemberArray('System.Runtime.GetNotifications', Types.Transaction, Types.Notification),
  // );
  builtins.addContractMember(
    'TransactionConstructor',
    'for',
    new ValueFor('System.Blockchain.GetTransaction', (sb, node, options) => {
      sb.emitHelper(node, options, sb.helpers.wrapTransaction);
    }),
  );
};
