import { CallFlags, common } from '@neo-one/client-common';
import { Types } from '../../constants';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinInstanceIndexValue } from './BuiltinInstanceIndexValue';
import { InstanceMemberWithScript } from './InstanceMemberWithScript';
import { ValueForWithScript } from './ValueForWithScript';
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
    new InstanceMemberWithScript(
      (sb, node, _options) => {
        // [blockchainObject]
        sb.emitPushInt(node, 0);
        // [txHash]
        sb.emitOp(node, 'PICKITEM');
        // [1, txHash]
        sb.emitPushInt(node, 1);
        // [[txHash]]
        sb.emitOp(node, 'PACK');
        // [number, [txHash]]
        sb.emitPushInt(node, CallFlags.ReadStates);
        // ['getTransactionHeight', number, [txHash]]
        sb.emitPushString(node, 'getTransactionHeight');
        // [buffer, 'getTransactionHeight', number, [txHash]]
        sb.emitPushBuffer(node, common.nativeHashes.Ledger);
        // [height]
        sb.emitSysCall(node, 'System.Contract.Call');
        sb.addMethodToken(common.nativeHashes.Ledger, 'getTransactionHeight', 1, true, CallFlags.ReadStates);
      },
      Types.Transaction,
      Types.Number,
    ),
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
  builtins.addContractMember(
    'TransactionConstructor',
    'for',
    new ValueForWithScript(
      (sb, node, _options) => {
        // [1, buffer]
        sb.emitPushInt(node, 1);
        // [[buffer]]
        sb.emitOp(node, 'PACK');
        // [number, [buffer]]
        sb.emitPushInt(node, CallFlags.ReadStates);
        // ['getTransaction', number, [buffer]]
        sb.emitPushString(node, 'getTransaction');
        // [buffer, 'getTransaction', number, [buffer]]
        sb.emitPushBuffer(node, common.nativeHashes.Ledger);
        // [contract]
        sb.emitSysCall(node, 'System.Contract.Call');
        sb.addMethodToken(common.nativeHashes.Ledger, 'getTransaction', 1, true, CallFlags.ReadStates);
      },
      (sb, node, options) => {
        sb.emitHelper(node, options, sb.helpers.wrapTransaction);
      },
    ),
  );
};
