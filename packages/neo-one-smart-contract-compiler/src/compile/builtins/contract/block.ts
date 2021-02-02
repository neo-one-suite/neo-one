import { Types } from '../../constants';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinInstanceIndexValue } from './BuiltinInstanceIndexValue';
import { ValueFor } from './ValueFor';
import { ValueInstanceOf } from './ValueInstanceOf';

class BlockInterface extends BuiltinInterface {}
class BlockConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('Block', new BlockInterface());
  builtins.addContractValue('Block', new ValueInstanceOf('BlockConstructor', (sb) => sb.helpers.isBlock));
  builtins.addContractMember('Block', 'hash', new BuiltinInstanceIndexValue(0, Types.Block, Types.Buffer));
  builtins.addContractMember('Block', 'version', new BuiltinInstanceIndexValue(1, Types.Block, Types.Number));
  builtins.addContractMember('Block', 'previousHash', new BuiltinInstanceIndexValue(2, Types.Block, Types.Buffer));
  builtins.addContractMember('Block', 'merkleRoot', new BuiltinInstanceIndexValue(3, Types.Block, Types.Buffer));
  builtins.addContractMember('Block', 'time', new BuiltinInstanceIndexValue(4, Types.Block, Types.Number));
  builtins.addContractMember('Block', 'index', new BuiltinInstanceIndexValue(5, Types.Block, Types.Number));
  builtins.addContractMember('Block', 'nextConsensus', new BuiltinInstanceIndexValue(6, Types.Block, Types.Buffer));
  builtins.addContractMember(
    'Block',
    'transactionsLength',
    new BuiltinInstanceIndexValue(7, Types.Block, Types.Number),
  );

  builtins.addContractInterface('BlockConstructor', new BlockConstructorInterface());
  builtins.addContractMember(
    'BlockConstructor',
    'for',
    new ValueFor('System.Blockchain.GetBlock', (sb, node, options) => {
      sb.emitHelper(node, options, sb.helpers.wrapBlock);
    }),
  );
};
