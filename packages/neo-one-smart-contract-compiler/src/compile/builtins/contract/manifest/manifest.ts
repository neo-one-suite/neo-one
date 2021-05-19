import { Types } from '../../../constants';
import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { BuiltinInstanceIndexArrayNullableValue } from '../BuiltinInstanceIndexArrayNullableValue';
import { BuiltinInstanceIndexArrayValue } from '../BuiltinInstanceIndexArrayValue';
import { BuiltinInstanceIndexValue } from '../BuiltinInstanceIndexValue';
import { ValueInstanceOf } from '../ValueInstanceOf';

class ContractManifestInterface extends BuiltinInterface {}
class ContractManifestConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('ContractManifest', new ContractManifestInterface());
  builtins.addContractValue(
    'ContractManifest',
    new ValueInstanceOf('ContractManifest', (sb) => sb.helpers.isContractManifest),
  );
  builtins.addContractInterface('ContractManifestConstructor', new ContractManifestConstructorInterface());
  builtins.addContractMember(
    'ContractManifest',
    'name',
    new BuiltinInstanceIndexValue(0, Types.ContractManifest, Types.String),
  );
  builtins.addContractMember(
    'ContractManifest',
    'groups',
    new BuiltinInstanceIndexArrayValue(1, Types.ContractManifest, Types.ContractGroup),
  );
  builtins.addContractMember(
    'ContractManifest',
    'supportedStandards',
    new BuiltinInstanceIndexArrayValue(3, Types.ContractManifest, Types.String),
  );
  builtins.addContractMember(
    'ContractManifest',
    'abi',
    new BuiltinInstanceIndexValue(4, Types.ContractManifest, Types.ContractABI),
  );
  builtins.addContractMember(
    'ContractManifest',
    'permissions',
    new BuiltinInstanceIndexArrayValue(5, Types.ContractManifest, Types.ContractPermission),
  );
  builtins.addContractMember(
    'ContractManifest',
    'trusts',
    new BuiltinInstanceIndexArrayNullableValue(6, Types.ContractManifest, Types.Buffer),
  );
  builtins.addContractMember(
    'ContractManifest',
    'extra',
    new BuiltinInstanceIndexValue(7, Types.ContractManifest, Types.String),
  );
};
