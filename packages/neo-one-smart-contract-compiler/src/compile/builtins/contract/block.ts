import { CallFlags, common } from '@neo-one/client-common';
import { Types } from '../../constants';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinInstanceIndexValue } from './BuiltinInstanceIndexValue';
import { ValueForWithScript } from './ValueForWithScript';
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
  builtins.addContractMember('Block', 'primaryIndex', new BuiltinInstanceIndexValue(6, Types.Block, Types.Number));
  builtins.addContractMember('Block', 'nextConsensus', new BuiltinInstanceIndexValue(7, Types.Block, Types.Buffer));
  builtins.addContractMember(
    'Block',
    'transactionsLength',
    new BuiltinInstanceIndexValue(8, Types.Block, Types.Number),
  );

  builtins.addContractInterface('BlockConstructor', new BlockConstructorInterface());
  builtins.addContractMember(
    'BlockConstructor',
    'for',
    new ValueForWithScript(
      (sb, node, _options) => {
        // [1, buffer]
        sb.emitPushInt(node, 1);
        // [[buffer]]
        sb.emitOp(node, 'PACK');
        // [number, [buffer]]
        sb.emitPushInt(node, CallFlags.None);
        // ['getBlock', number, [buffer]]
        sb.emitPushString(node, 'getBlock');
        // [buffer, 'getBlock', number, [buffer]]
        sb.emitPushBuffer(node, common.nativeHashes.Ledger);
        // [conract]
        sb.emitSysCall(node, 'System.Contract.Call');
      },
      (sb, node, options) => {
        sb.emitHelper(node, options, sb.helpers.wrapBlock);
      },
    ),
  );
};
