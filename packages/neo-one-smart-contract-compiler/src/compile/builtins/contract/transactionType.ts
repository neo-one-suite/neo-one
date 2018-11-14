import { TransactionTypeModel as TransactionType } from '@neo-one/client-common';
import { BuiltinBase } from '../BuiltinBase';
import { BuiltinConstantNumberMemberValue } from '../BuiltinConstantNumberMemberValue';
import { Builtins } from '../Builtins';

class TransactionTypeValue extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractValue('TransactionType', new TransactionTypeValue());
  builtins.addContractMember('TransactionType', 'Miner', new BuiltinConstantNumberMemberValue(TransactionType.Miner));
  builtins.addContractMember('TransactionType', 'Issue', new BuiltinConstantNumberMemberValue(TransactionType.Issue));
  builtins.addContractMember('TransactionType', 'Claim', new BuiltinConstantNumberMemberValue(TransactionType.Claim));
  builtins.addContractMember(
    'TransactionType',
    'Enrollment',
    new BuiltinConstantNumberMemberValue(TransactionType.Enrollment),
  );
  builtins.addContractMember(
    'TransactionType',
    'Register',
    new BuiltinConstantNumberMemberValue(TransactionType.Register),
  );
  builtins.addContractMember(
    'TransactionType',
    'Contract',
    new BuiltinConstantNumberMemberValue(TransactionType.Contract),
  );
  builtins.addContractMember('TransactionType', 'State', new BuiltinConstantNumberMemberValue(TransactionType.State));
  builtins.addContractMember(
    'TransactionType',
    'Publish',
    new BuiltinConstantNumberMemberValue(TransactionType.Publish),
  );
  builtins.addContractMember(
    'TransactionType',
    'Invocation',
    new BuiltinConstantNumberMemberValue(TransactionType.Invocation),
  );
};
