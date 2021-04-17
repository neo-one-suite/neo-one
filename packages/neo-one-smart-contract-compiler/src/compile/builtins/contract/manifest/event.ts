import { Types } from '../../../constants';
import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { BuiltinInstanceIndexArrayValue } from '../BuiltinInstanceIndexArrayValue';
import { BuiltinInstanceIndexValue } from '../BuiltinInstanceIndexValue';
import { ValueInstanceOf } from '../ValueInstanceOf';

class ContractEventDescriptorInterface extends BuiltinInterface {}
class ContractEventDescriptorConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('ContractEventDescriptor', new ContractEventDescriptorInterface());
  builtins.addContractValue(
    'ContractEventDescriptor',
    new ValueInstanceOf('ContractEventDescriptorConstructor', (sb) => sb.helpers.isContractEvent),
  );
  builtins.addContractInterface(
    'ContractEventDescriptorConstructor',
    new ContractEventDescriptorConstructorInterface(),
  );
  builtins.addContractMember(
    'ContractEventDescriptor',
    'name',
    new BuiltinInstanceIndexValue(0, Types.ContractEvent, Types.String),
  );
  builtins.addContractMember(
    'ContractEventDescriptor',
    'parameters',
    new BuiltinInstanceIndexArrayValue(1, Types.ContractEvent, Types.ContractParameter),
  );
};
