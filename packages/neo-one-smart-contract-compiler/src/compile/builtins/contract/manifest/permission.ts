import { Types } from '../../../constants';
import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { BuiltinInstanceIndexArrayNullableValue } from '../BuiltinInstanceIndexArrayNullableValue';
import { BuiltinInstanceIndexNullableValue } from '../BuiltinInstanceIndexNullableValue';
import { ValueInstanceOf } from '../ValueInstanceOf';

class ContractPermissionInterface extends BuiltinInterface {}
class ContractPermissionConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('ContractPermission', new ContractPermissionInterface());
  builtins.addContractValue(
    'ContractPermission',
    new ValueInstanceOf('ContractPermissionConstructor', (sb) => sb.helpers.isContractPermission),
  );
  builtins.addContractInterface('ContractPermissionConstructor', new ContractPermissionConstructorInterface());
  builtins.addContractMember(
    'ContractPermission',
    'contract',
    new BuiltinInstanceIndexNullableValue(0, Types.ContractPermission, Types.Buffer),
  );
  builtins.addContractMember(
    'ContractPermission',
    'methods',
    new BuiltinInstanceIndexArrayNullableValue(1, Types.ContractPermission, Types.String),
  );
};
