import { Types } from '../../../constants';
import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { BuiltinInstanceIndexValue } from '../BuiltinInstanceIndexValue';
import { ValueInstanceOf } from '../ValueInstanceOf';

class ContractGroupInterface extends BuiltinInterface {}
class ContractGroupConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('ContractGroup', new ContractGroupInterface());
  builtins.addContractValue(
    'ContractGroup',
    new ValueInstanceOf('ContractGroupConstructor', (sb) => sb.helpers.isContractGroup),
  );
  builtins.addContractInterface('ContractGroupConstructor', new ContractGroupConstructorInterface());
  builtins.addContractMember(
    'ContractGroup',
    'publicKey',
    new BuiltinInstanceIndexValue(0, Types.ContractGroup, Types.Buffer),
  );
  builtins.addContractMember(
    'ContractGroup',
    'signature',
    new BuiltinInstanceIndexValue(1, Types.ContractGroup, Types.Buffer),
  );
};
