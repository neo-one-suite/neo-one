import { common } from '@neo-one/client-common';
import { Types } from '../../constants';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { BuiltinInstanceIndexValue } from './BuiltinInstanceIndexValue';
import { ValueForWithScript } from './ValueForWithScript';
import { ValueInstanceOf } from './ValueInstanceOf';

class ContractInterface extends BuiltinInterface {}
class ContractConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('Contract', new ContractInterface());
  builtins.addContractValue('Contract', new ValueInstanceOf('ContractConstructor', (sb) => sb.helpers.isContract));
  builtins.addContractMember('Contract', 'script', new BuiltinInstanceIndexValue(0, Types.Contract, Types.Buffer));
  builtins.addContractMember('Contract', 'manifest', new BuiltinInstanceIndexValue(1, Types.Contract, Types.String));
  builtins.addContractMember('Contract', 'hasStorage', new BuiltinInstanceIndexValue(2, Types.Contract, Types.Boolean));
  builtins.addContractMember('Contract', 'payable', new BuiltinInstanceIndexValue(3, Types.Contract, Types.Boolean));
  builtins.addContractInterface('ContractConstructor', new ContractConstructorInterface());
  builtins.addContractMember(
    'ContractConstructor',
    'for',
    // TODO: this can be better/cleaner. also needs to be tested
    new ValueForWithScript(
      (sb, node, _options) => {
        // [1, buffer]
        sb.emitPushInt(node, 1);
        // [[buffer]]
        sb.emitOp(node, 'PACK');
        // ['getContract', [buffer]]
        sb.emitPushString(node, 'getContract');
        // [buffer, 'getContract', [buffer]]
        sb.emitPushBuffer(node, common.nativeHashes.Management);
        // [conract]
        sb.emitSysCall(node, 'System.Contract.Call');
      },
      (sb, node, options) => {
        sb.emitHelper(
          node,
          options,
          sb.helpers.if({
            condition: () => {
              // [buffer, buffer]
              sb.emitOp(node, 'DUP');
              // [buffer, buffer, buffer]
              sb.emitPushBuffer(node, Buffer.from([]));
              // [boolean, buffer]
              sb.emitOp(node, 'EQUAL');
            },
            whenTrue: () => {
              sb.emitOp(node, 'DROP');
              sb.emitHelper(node, options, sb.helpers.wrapUndefined);
            },
            whenFalse: () => {
              sb.emitHelper(node, options, sb.helpers.wrapContract);
            },
          }),
        );
      },
    ),
  );
};
