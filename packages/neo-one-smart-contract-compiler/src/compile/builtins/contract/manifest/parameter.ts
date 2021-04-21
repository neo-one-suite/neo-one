import { Types } from '../../../constants';
import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { BuiltinInstanceIndexValue } from '../BuiltinInstanceIndexValue';
import { ValueInstanceOf } from '../ValueInstanceOf';

class ContractParameterDefinitionInterface extends BuiltinInterface {}
class ContractParameterDefinitionConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('ContractParameterDefinition', new ContractParameterDefinitionInterface());
  builtins.addContractValue(
    'ContractParameterDefinition',
    new ValueInstanceOf('ContractParameterDefinitionConstructor', (sb) => sb.helpers.isContractParameter),
  );
  builtins.addContractInterface(
    'ContractParameterDefinitionConstructor',
    new ContractParameterDefinitionConstructorInterface(),
  );
  builtins.addContractMember(
    'ContractParameterDefinition',
    'name',
    new BuiltinInstanceIndexValue(0, Types.ContractParameter, Types.String),
  );
  builtins.addContractMember(
    'ContractParameterDefinition',
    'type',
    new BuiltinInstanceIndexValue(1, Types.ContractParameter, Types.Number),
  );
};
