import { Types } from '../../constants';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { SysCallInstanceMemberPrimitive } from './SysCallInstanceMemberPrimitive';
import { ValueFor } from './ValueFor';
import { ValueInstanceOf } from './ValueInstanceOf';

class ContractInterface extends BuiltinInterface {}
class ContractConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('Contract', new ContractInterface());
  builtins.addContractValue('Contract', new ValueInstanceOf('ContractConstructor', (sb) => sb.helpers.isContract));
  builtins.addContractMember(
    'Contract',
    'script',
    new SysCallInstanceMemberPrimitive('Neo.Contract.GetScript', Types.Contract, Types.Buffer),
  );
  builtins.addContractMember(
    'Contract',
    'payable',
    new SysCallInstanceMemberPrimitive('Neo.Contract.IsPayable', Types.Contract, Types.Boolean),
  );

  builtins.addContractInterface('ContractConstructor', new ContractConstructorInterface());
  builtins.addContractMember(
    'ContractConstructor',
    'for',
    new ValueFor('Neo.Blockchain.GetContract', (sb, node, options) => {
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
    }),
  );
};
