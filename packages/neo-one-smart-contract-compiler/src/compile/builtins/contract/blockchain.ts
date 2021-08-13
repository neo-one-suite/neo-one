import { CallFlags, common } from '@neo-one/client-common';
import { GlobalProperty, Types } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInterface } from '../BuiltinInterface';
import { BuiltinMemberValue } from '../BuiltinMemberValue';
import { Builtins } from '../Builtins';
import { BuiltinValueObject } from '../BuiltinValueObject';
import { MemberLikeExpression } from '../types';
import { BlockchainCurrentTransfers } from './BlockchainCurrentTransfers';
import { NativeContractCallValue } from './NativeContractCallValue';
import { SysCallMemberValue } from './SysCallMemberValue';

class BlockchainValue extends BuiltinValueObject {
  public readonly type = 'BlockchainConstructor';
}
class BlockchainConstructorInterface extends BuiltinInterface {}

class BlockchainCurrentCallerContract extends BuiltinMemberValue {
  protected emit(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions): void {
    if (options.pushValue) {
      // [buffer]
      sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: GlobalProperty.CallingScriptHash }));
      // [buffer, buffer]
      sb.emitOp(node, 'DUP');
      // [1, buffer, buffer]
      sb.emitPushInt(node, 1);
      // [[buffer], buffer]
      sb.emitOp(node, 'PACK');
      // [number, [buffer], buffer]
      sb.emitPushInt(node, CallFlags.ReadStates);
      // ['getContract', number, [buffer], buffer]
      sb.emitPushString(node, 'getContract');
      // [buffer, 'getContract', number, [buffer], buffer]
      sb.emitPushBuffer(node, common.nativeHashes.ContractManagement);
      // [conract, buffer]
      sb.emitSysCall(node, 'System.Contract.Call');
      sb.addMethodToken(common.nativeHashes.ContractManagement, 'getContract', 1, true, CallFlags.ReadStates);
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [buffer, buffer]
            sb.emitOp(node, 'ISNULL');
          },
          whenTrue: () => {
            // []
            sb.emitOp(node, 'DROP');
            // [val]
            sb.emitHelper(node, options, sb.helpers.wrapUndefined);
          },
          whenFalse: () => {
            // [val]
            sb.emitHelper(node, options, sb.helpers.wrapBuffer);
          },
        }),
      );
    }
  }
}

class BlockchainCurrentBlockTime extends BuiltinMemberValue {
  protected emit(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions): void {
    if (options.pushValue) {
      // [time]
      sb.emitSysCall(node, 'System.Runtime.GetTime');
      // [1000, time]
      sb.emitPushInt(node, 1000);
      // [time]
      sb.emitOp(node, 'DIV');
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapNumber);
    }
  }
}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractValue('Blockchain', new BlockchainValue());
  builtins.addContractInterface('BlockchainConstructor', new BlockchainConstructorInterface());
  builtins.addContractMember('BlockchainConstructor', 'currentBlockTime', new BlockchainCurrentBlockTime());
  builtins.addContractMember(
    'BlockchainConstructor',
    'currentBlockTimeMilliseconds',
    new SysCallMemberValue('System.Runtime.GetTime', Types.Number),
  );
  builtins.addContractMember(
    'BlockchainConstructor',
    'currentHeight',
    new NativeContractCallValue('currentIndex', CallFlags.ReadStates, common.nativeHashes.Ledger, Types.Number),
  );
  builtins.addContractMember(
    'BlockchainConstructor',
    'currentTransaction',
    new SysCallMemberValue('System.Runtime.GetScriptContainer', Types.Transaction),
  );
  builtins.addContractMember('BlockchainConstructor', 'currentCallerContract', new BlockchainCurrentCallerContract());
  builtins.addContractMember(
    'BlockchainConstructor',
    'currentNEOTransfers',
    new BlockchainCurrentTransfers(common.nativeHashes.NEO),
  );
  builtins.addContractMember(
    'BlockchainConstructor',
    'currentGASTransfers',
    new BlockchainCurrentTransfers(common.nativeHashes.GAS),
  );
  builtins.addContractMember(
    'BlockchainConstructor',
    'networkNumber',
    new SysCallMemberValue('System.Runtime.GetNetwork', Types.Number),
  );
  builtins.addContractMember(
    'BlockchainConstructor',
    'randomNumber',
    new SysCallMemberValue('System.Runtime.GetRandom', Types.Number),
  );
};
