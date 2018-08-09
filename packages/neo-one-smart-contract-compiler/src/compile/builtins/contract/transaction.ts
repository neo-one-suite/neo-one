import { Types } from '../../helper/types/Types';
import { BuiltinBase } from '../BuiltinBase';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { SysCallInstanceMemberArray } from './SysCallInstanceMemberArray';
import { SysCallInstanceMemberPrimitive } from './SysCallInstanceMemberPrimitive';
import { SysCallMemberValue } from './SysCallMemberValue';
import { ValueFor } from './ValueFor';
import { ValueInstanceOf } from './ValueInstanceOf';

class TransactionBaseInterface extends BuiltinInterface {}
class TransactionBaseConstructorInterface extends BuiltinInterface {}
class TransactionValue extends BuiltinBase {}
class TransactionConstructorInterface extends BuiltinInterface {}
class MinerTransactionInterface extends BuiltinInterface {}
class IssueTransactionInterface extends BuiltinInterface {}
class ClaimTransactionInterface extends BuiltinInterface {}
class EnrollmentTransactionInterface extends BuiltinInterface {}
class RegisterTransactionInterface extends BuiltinInterface {}
class ContractTransactionInterface extends BuiltinInterface {}
class StateTransactionInterface extends BuiltinInterface {}
class PublishTransactionInterface extends BuiltinInterface {}
class InvocationTransactionInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('TransactionBase', new TransactionBaseInterface());
  builtins.addContractValue('TransactionBase', new ValueInstanceOf((sb) => sb.helpers.isTransaction));
  builtins.addContractInterface('TransactionBaseConstructor', new TransactionBaseConstructorInterface());
  builtins.addContractMember(
    'TransactionBase',
    'type',
    new SysCallInstanceMemberPrimitive('Neo.Transaction.GetType', Types.Transaction, Types.Number),
  );
  builtins.addContractMember(
    'TransactionBase',
    'hash',
    new SysCallInstanceMemberPrimitive('Neo.Transaction.GetHash', Types.Transaction, Types.Buffer),
  );
  builtins.addContractMember(
    'TransactionBase',
    'attributes',
    new SysCallInstanceMemberArray('Neo.Transaction.GetAttributes', Types.Transaction, Types.Attribute),
  );
  builtins.addContractMember(
    'TransactionBase',
    'outputs',
    new SysCallInstanceMemberArray('Neo.Transaction.GetOutputs', Types.Transaction, Types.Output),
  );
  builtins.addContractMember(
    'TransactionBase',
    'inputs',
    new SysCallInstanceMemberArray('Neo.Transaction.GetInputs', Types.Transaction, Types.Input),
  );
  builtins.addContractMember(
    'TransactionBase',
    'references',
    new SysCallInstanceMemberArray('Neo.Transaction.GetReferences', Types.Transaction, Types.Output),
  );
  builtins.addContractMember(
    'TransactionBase',
    'unspentOutputs',
    new SysCallInstanceMemberArray('Neo.Transaction.GetUnspentCoins', Types.Transaction, Types.Output),
  );

  builtins.addContractInterface('InvocationTransaction', new InvocationTransactionInterface());
  builtins.addContractMember(
    'InvocationTransaction',
    'script',
    new SysCallInstanceMemberPrimitive('Neo.InvocationTransaction.GetScript', Types.Transaction, Types.Buffer),
  );
  builtins.addContractInterface('MinerTransaction', new MinerTransactionInterface());
  builtins.addContractInterface('IssueTransaction', new IssueTransactionInterface());
  builtins.addContractInterface('ClaimTransaction', new ClaimTransactionInterface());
  builtins.addContractInterface('EnrollmentTransaction', new EnrollmentTransactionInterface());
  builtins.addContractInterface('RegisterTransaction', new RegisterTransactionInterface());
  builtins.addContractInterface('ContractTransaction', new ContractTransactionInterface());
  builtins.addContractInterface('StateTransaction', new StateTransactionInterface());
  builtins.addContractInterface('PublishTransaction', new PublishTransactionInterface());

  builtins.addContractValue('Transaction', new TransactionValue());
  builtins.addContractInterface('TransactionConstructor', new TransactionConstructorInterface());
  builtins.addContractMember(
    'TransactionConstructor',
    'for',
    new ValueFor('Neo.Blockchain.GetTransaction', (sb) => sb.helpers.wrapTransaction),
  );
  builtins.addContractMember(
    'TransactionConstructor',
    'currentTransaction',
    new SysCallMemberValue('System.ExecutionEngine.GetScriptContainer', Types.Transaction),
  );
};
