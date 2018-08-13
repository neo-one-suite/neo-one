import { Types } from '../../constants';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { SysCallInstanceMemberArray } from './SysCallInstanceMemberArray';
import { ValueFor } from './ValueFor';
import { ValueInstanceOf } from './ValueInstanceOf';

class BlockInterface extends BuiltinInterface {}
class BlockConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('Block', new BlockInterface());
  builtins.addContractValue('Block', new ValueInstanceOf((sb) => sb.helpers.isBlock));
  builtins.addContractMember(
    'Block',
    'transactions',
    new SysCallInstanceMemberArray('Neo.Block.GetTransactions', Types.Block, Types.Transaction),
  );

  builtins.addContractInterface('BlockConstructor', new BlockConstructorInterface());
  builtins.addContractMember(
    'BlockConstructor',
    'for',
    new ValueFor('Neo.Blockchain.GetBlock', (sb, node, options) => {
      sb.emitHelper(node, options, sb.helpers.wrapBlock);
    }),
  );
};
