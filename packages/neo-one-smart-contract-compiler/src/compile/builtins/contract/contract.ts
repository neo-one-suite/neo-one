import { CallFlags, common } from '@neo-one/client-common';
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
  builtins.addContractMember('Contract', 'id', new BuiltinInstanceIndexValue(0, Types.Contract, Types.Number));
  builtins.addContractMember(
    'Contract',
    'updateCounter',
    new BuiltinInstanceIndexValue(1, Types.Contract, Types.Number),
  );
  builtins.addContractMember('Contract', 'hash', new BuiltinInstanceIndexValue(2, Types.Contract, Types.Buffer));
  builtins.addContractMember('Contract', 'nef', new BuiltinInstanceIndexValue(3, Types.Contract, Types.Buffer));
  builtins.addContractMember(
    'Contract',
    'manifest',
    new BuiltinInstanceIndexValue(4, Types.Contract, Types.ContractManifest),
  );
  builtins.addContractInterface('ContractConstructor', new ContractConstructorInterface());
  builtins.addContractMember(
    'ContractConstructor',
    'for',
    new ValueForWithScript(
      (sb, node, _options) => {
        // [1, buffer]
        sb.emitPushInt(node, 1);
        // [[buffer]]
        sb.emitOp(node, 'PACK');
        // [number, [buffer]]
        sb.emitPushInt(node, CallFlags.ReadStates);
        // ['getContract', number, [buffer]]
        sb.emitPushString(node, 'getContract');
        // [buffer, 'getContract', number, [buffer]]
        sb.emitPushBuffer(node, common.nativeHashes.ContractManagement);
        // [contract]
        sb.emitSysCall(node, 'System.Contract.Call');
      },
      (sb, node, options) => {
        sb.emitHelper(
          node,
          options,
          sb.helpers.if({
            condition: () => {
              // [contract, contract]
              sb.emitOp(node, 'DUP');
              // [isnull, contract]
              sb.emitOp(node, 'ISNULL');
            },
            whenTrue: () => {
              // []
              sb.emitOp(node, 'DROP');
              // [val]
              sb.emitHelper(node, options, sb.helpers.wrapUndefined);
            },
            whenFalse: () => {
              // [contractVal]
              sb.emitHelper(node, options, sb.helpers.wrapContract);
            },
          }),
        );
      },
    ),
  );
};
