import { Types } from '../../constants';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinValueObject } from '../BuiltinValueObject';
import { SysCallMemberValue } from './SysCallMemberValue';

class BlockchainValue extends BuiltinValueObject {
  public readonly type = 'BlockchainConstructor';
}
class BlockchainConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractValue('Blockchain', new BlockchainValue());
  builtins.addContractInterface('BlockchainConstructor', new BlockchainConstructorInterface());
  builtins.addContractMember(
    'BlockchainConstructor',
    'currentBlockTime',
    new SysCallMemberValue('Neo.Runtime.GetTime', Types.Number),
  );
  builtins.addContractMember(
    'BlockchainConstructor',
    'currentHeight',
    new SysCallMemberValue('Neo.Blockchain.GetHeight', Types.Number),
  );
  builtins.addContractMember(
    'BlockchainConstructor',
    'currentTransaction',
    new SysCallMemberValue('System.ExecutionEngine.GetScriptContainer', Types.Transaction),
  );
  builtins.addContractMember(
    'BlockchainConstructor',
    'contractAddress',
    new SysCallMemberValue('System.ExecutionEngine.GetExecutingScriptHash', Types.Buffer),
  );
};
