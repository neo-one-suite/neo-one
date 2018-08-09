import { Types } from '../../helper/types/Types';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { SysCallInstanceMemberPrimitive } from './SysCallInstanceMemberPrimitive';
import { ValueInstanceOf } from './ValueInstanceOf';

class OutputInterface extends BuiltinInterface {}
class OutputConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('Output', new OutputInterface());
  builtins.addContractValue('Output', new ValueInstanceOf((sb) => sb.helpers.isOutput));
  builtins.addContractMember(
    'Output',
    'address',
    new SysCallInstanceMemberPrimitive('Neo.Output.GetScriptHash', Types.Output, Types.Buffer),
  );
  builtins.addContractMember(
    'Output',
    'asset',
    new SysCallInstanceMemberPrimitive('Neo.Output.GetAssetId', Types.Output, Types.Buffer),
  );
  builtins.addContractMember(
    'Output',
    'value',
    new SysCallInstanceMemberPrimitive('Neo.Output.GetValue', Types.Output, Types.Number),
  );
  builtins.addContractInterface('OutputConstructor', new OutputConstructorInterface());
};
