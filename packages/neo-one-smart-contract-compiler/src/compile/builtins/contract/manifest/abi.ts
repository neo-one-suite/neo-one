import { Types } from '../../../constants';
import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { BuiltinInstanceIndexArrayValue } from '../BuiltinInstanceIndexArrayValue';
import { ValueInstanceOf } from '../ValueInstanceOf';

class ContractABIInterface extends BuiltinInterface {}
class ContractABIConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('ContractABI', new ContractABIInterface());
  builtins.addContractValue(
    'ContractABI',
    new ValueInstanceOf('ContractABIConstructor', (sb) => sb.helpers.isContractABI),
  );
  builtins.addContractInterface('ContractABIConstructor', new ContractABIConstructorInterface());
  builtins.addContractMember(
    'ContractABI',
    'methods',
    new BuiltinInstanceIndexArrayValue(0, Types.ContractABI, Types.ContractMethod),
  );
  builtins.addContractMember(
    'ContractABI',
    'events',
    new BuiltinInstanceIndexArrayValue(1, Types.ContractABI, Types.ContractEvent),
  );
};
