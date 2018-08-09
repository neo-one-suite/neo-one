import { Types } from '../../helper/types/Types';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { SysCallInstanceMemberPrimitive } from './SysCallInstanceMemberPrimitive';
import { ValueFor } from './ValueFor';
import { ValueInstanceOf } from './ValueInstanceOf';

class ContractInterface extends BuiltinInterface {}
class ContractConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('Contract', new ContractInterface());
  builtins.addContractValue('Contract', new ValueInstanceOf((sb) => sb.helpers.isContract));
  builtins.addContractMember(
    'Contract',
    'script',
    new SysCallInstanceMemberPrimitive('Neo.Contract.GetScript', Types.Contract, Types.Buffer),
  );

  builtins.addContractInterface('ContractConstructor', new ContractConstructorInterface());
  builtins.addContractMember(
    'ContractConstructor',
    'for',
    new ValueFor('Neo.Blockchain.GetContract', (sb) => sb.helpers.wrapContract),
  );
};
