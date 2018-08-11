import { Types } from '../../helper/types/Types';
import { BuiltinBase } from '../BuiltinBase';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { SysCallMemberValue } from './SysCallMemberValue';

class BlockchainValue extends BuiltinBase {}
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
};
