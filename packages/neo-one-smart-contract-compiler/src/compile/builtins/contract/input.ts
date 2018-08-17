import { Types } from '../../constants';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { SysCallInstanceMemberPrimitive } from './SysCallInstanceMemberPrimitive';
import { ValueInstanceOf } from './ValueInstanceOf';

class InputInterface extends BuiltinInterface {}
class InputConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('Input', new InputInterface());
  builtins.addContractValue('Input', new ValueInstanceOf((sb) => sb.helpers.isInput));
  builtins.addContractInterface('InputConstructor', new InputConstructorInterface());
  builtins.addContractMember(
    'Input',
    'hash',
    new SysCallInstanceMemberPrimitive('Neo.Input.GetHash', Types.Input, Types.Buffer),
  );
  builtins.addContractMember(
    'Input',
    'index',
    new SysCallInstanceMemberPrimitive('Neo.Input.GetIndex', Types.Input, Types.Number),
  );
};
