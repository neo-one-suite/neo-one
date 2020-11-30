import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinValueObject } from '../BuiltinValueObject';
import { ValueFor } from './ValueFor';

class TransactionInterface extends BuiltinInterface {}
class TransactionValue extends BuiltinValueObject {
  public readonly type = 'TransactionConstructor';
}
class TransactionConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('Transaction', new TransactionInterface());
  builtins.addContractInterface('TransactionConstructor', new TransactionConstructorInterface());

  builtins.addContractValue('Transaction', new TransactionValue());
  builtins.addContractMember(
    'TransactionConstructor',
    'for',
    new ValueFor('System.Blockchain.GetTransaction', (sb, node, options) => {
      sb.emitHelper(node, options, sb.helpers.wrapTransaction);
    }),
  );
};
