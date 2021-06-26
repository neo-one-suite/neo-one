import { Types } from '../../constants';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinInstanceIndexValue } from './BuiltinInstanceIndexValue';
import { ValueInstanceOf } from './ValueInstanceOf';

class TransferInterface extends BuiltinInterface {}
class TransferConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('Transfer', new TransferInterface());
  builtins.addContractInterface('TransferConstructor', new TransferConstructorInterface());
  builtins.addContractValue('Transfer', new ValueInstanceOf('TransferConstructor', (sb) => sb.helpers.isTransfer));
  builtins.addContractMember('Transfer', 'to', new BuiltinInstanceIndexValue(0, Types.Transfer, Types.Buffer, false));
  builtins.addContractMember(
    'Transfer',
    'amount',
    new BuiltinInstanceIndexValue(1, Types.Transfer, Types.Number, false),
  );
  builtins.addContractMember('Transfer', 'from', new BuiltinInstanceIndexValue(2, Types.Transfer, Types.Buffer, false));
  builtins.addContractMember(
    'Transfer',
    'asset',
    new BuiltinInstanceIndexValue(3, Types.Transfer, Types.Buffer, false),
  );
};
