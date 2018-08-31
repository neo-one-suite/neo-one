import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ErrorSlots, Types } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInterface } from '../BuiltinInterface';
import { BuiltinNew } from '../BuiltinNew';
import { Builtins } from '../Builtins';
import { BuiltinSlotInstanceMemberValue } from '../BuiltinSlotInstanceMemberValue';

class ErrorInterface extends BuiltinInterface {}
class ErrorValue extends BuiltinNew {
  public emitInstanceOf(sb: ScriptBuilder, node: ts.Expression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [val]
    sb.visit(node, options);
    if (optionsIn.pushValue) {
      // [boolean]
      sb.emitHelper(node, options, sb.helpers.isError);
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapBoolean);
    } else {
      // []
      /* istanbul ignore next */
      sb.emitOp(node, 'DROP');
    }
  }

  public emitNew(sb: ScriptBuilder, node: ts.NewExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const args = tsUtils.argumented.getArgumentsArray(node);
    if (args.length === 0) {
      // [string]
      sb.emitPushString(node, '');
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapString);
    } else {
      // [val]
      sb.visit(args[0], options);
    }
    // [map, val]
    sb.emitOp(node, 'NEWMAP');
    // [map, val, map]
    sb.emitOp(node, 'TUCK');
    // [number, map, val, map]
    sb.emitPushInt(node, ErrorSlots.message);
    // [val, number, map, map]
    sb.emitOp(node, 'ROT');
    // [map]
    sb.emitOp(node, 'SETITEM');
    // [val]
    sb.emitHelper(node, optionsIn, sb.helpers.wrapError);
  }
}
class ErrorConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('Error', new ErrorInterface());
  builtins.addValue('Error', new ErrorValue());
  builtins.addMember('Error', 'message', new BuiltinSlotInstanceMemberValue(Types.Error, ErrorSlots.message));
  builtins.addInterface('ErrorConstructor', new ErrorConstructorInterface());
};
