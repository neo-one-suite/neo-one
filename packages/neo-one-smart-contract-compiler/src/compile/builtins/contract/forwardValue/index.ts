import ts from 'typescript';
import { Types } from '../../../constants';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinInstanceOf } from '../../BuiltinInstanceOf';
import { BuiltinInterface } from '../../BuiltinInterface';
import { Builtins } from '../../Builtins';
import { ForwardValueAs } from './ForwardValueAs';

class ForwardValueInterface extends BuiltinInterface {}
class ForwardValueValue extends BuiltinInstanceOf {
  public readonly type = 'ForwardValueConstructor';

  public emitInstanceOf(sb: ScriptBuilder, node: ts.Expression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [val]
    sb.visit(node, options);
    if (optionsIn.pushValue) {
      // [boolean]
      sb.emitHelper(node, options, sb.helpers.isForwardValue);
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapBoolean);
    } else {
      // []
      /* istanbul ignore next */
      sb.emitOp(node, 'DROP');
    }
  }
}
class ForwardValueConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractInterface('ForwardValue', new ForwardValueInterface());
  builtins.addContractValue('ForwardValue', new ForwardValueValue());
  builtins.addContractMember('ForwardValue', 'asString', new ForwardValueAs(Types.String));
  builtins.addContractMember('ForwardValue', 'asStringNullable', new ForwardValueAs(Types.String, true));
  builtins.addContractMember('ForwardValue', 'asNumber', new ForwardValueAs(Types.Number));
  builtins.addContractMember('ForwardValue', 'asNumberNullable', new ForwardValueAs(Types.Number, true));
  builtins.addContractMember('ForwardValue', 'asBoolean', new ForwardValueAs(Types.Boolean));
  builtins.addContractMember('ForwardValue', 'asBuffer', new ForwardValueAs(Types.Buffer));
  builtins.addContractMember('ForwardValue', 'asBufferNullable', new ForwardValueAs(Types.Buffer, true));
  builtins.addContractMember('ForwardValue', 'asAddress', new ForwardValueAs(Types.Buffer));
  builtins.addContractMember('ForwardValue', 'asAddressNullable', new ForwardValueAs(Types.Buffer, true));
  builtins.addContractMember('ForwardValue', 'asHash256', new ForwardValueAs(Types.Buffer));
  builtins.addContractMember('ForwardValue', 'asHash256Nullable', new ForwardValueAs(Types.Buffer, true));
  builtins.addContractMember('ForwardValue', 'asPublicKey', new ForwardValueAs(Types.Buffer));
  builtins.addContractMember('ForwardValue', 'asPublicKeyNullable', new ForwardValueAs(Types.Buffer, true));
  builtins.addContractMember('ForwardValue', 'asArray', new ForwardValueAs(Types.Array));
  builtins.addContractMember('ForwardValue', 'asArrayNullable', new ForwardValueAs(Types.Array, true));
  builtins.addContractInterface('ForwardValueConstructor', new ForwardValueConstructorInterface());
};
