import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceOf } from '../BuiltinInstanceOf';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { ArrayFilter } from './filter';
import { ArrayForEach } from './forEach';
import { ArrayIterator } from './iterator';
import { ArrayLength } from './length';
import { ArrayMap } from './map';
import { ArrayReduce } from './reduce';

class ArrayInterface extends BuiltinInterface {}
class ArrayValue extends BuiltinInstanceOf {
  public emitInstanceOf(sb: ScriptBuilder, node: ts.Expression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [val]
    sb.visit(node, options);
    if (optionsIn.pushValue) {
      // [boolean]
      sb.emitHelper(node, options, sb.helpers.isArray);
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapBoolean);
    } else {
      // []
      /* istanbul ignore next */
      sb.emitOp(node, 'DROP');
    }
  }
}
class ArrayConstructorInterface extends BuiltinInterface {}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('Array', new ArrayInterface());
  builtins.addValue('Array', new ArrayValue());
  builtins.addMember('Array', 'filter', new ArrayFilter());
  builtins.addMember('Array', 'forEach', new ArrayForEach());
  builtins.addMember('Array', '__@iterator', new ArrayIterator());
  builtins.addMember('Array', 'length', new ArrayLength());
  builtins.addMember('Array', 'map', new ArrayMap());
  builtins.addMember('Array', 'reduce', new ArrayReduce());
  builtins.addInterface('ArrayConstructor', new ArrayConstructorInterface());
};
