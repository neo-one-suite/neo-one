import { Types } from '../../../constants';
import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { BuiltinInstanceIndexArrayValue } from '../BuiltinInstanceIndexArrayValue';
import { BuiltinInstanceIndexValue } from '../BuiltinInstanceIndexValue';
import { ValueInstanceOf } from '../ValueInstanceOf';

class ContractMethodDescriptorInterface extends BuiltinInterface {}
class ContractMethodDescriptorConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('ContractMethodDescriptor', new ContractMethodDescriptorInterface());
  builtins.addContractValue(
    'ContractMethodDescriptor',
    new ValueInstanceOf('ContractMethodDescriptorConstructor', (sb) => sb.helpers.isContractMethod),
  );
  builtins.addContractInterface(
    'ContractMethodDescriptorConstructor',
    new ContractMethodDescriptorConstructorInterface(),
  );
  builtins.addContractMember(
    'ContractMethodDescriptor',
    'name',
    new BuiltinInstanceIndexValue(0, Types.ContractMethod, Types.String),
  );
  builtins.addContractMember(
    'ContractMethodDescriptor',
    'parameters',
    new BuiltinInstanceIndexArrayValue(1, Types.ContractMethod, Types.ContractParameter),
  );
  builtins.addContractMember(
    'ContractMethodDescriptor',
    'returnType',
    new BuiltinInstanceIndexValue(2, Types.ContractMethod, Types.Number),
  );
  builtins.addContractMember(
    'ContractMethodDescriptor',
    'offset',
    new BuiltinInstanceIndexValue(3, Types.ContractMethod, Types.Number),
  );
  builtins.addContractMember(
    'ContractMethodDescriptor',
    'safe',
    new BuiltinInstanceIndexValue(4, Types.ContractMethod, Types.Boolean),
  );
};
