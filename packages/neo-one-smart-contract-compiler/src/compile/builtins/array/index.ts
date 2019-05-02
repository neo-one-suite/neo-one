import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceOf } from '../BuiltinInstanceOf';
import { BuiltinInterface } from '../BuiltinInterface';
import { Builtins } from '../Builtins';
import { Builtin } from '../types';
import { ArrayConcat } from './concat';
import { ArrayEntries } from './entries';
import { ArrayEvery } from './every';
import { ArrayFilter } from './filter';
import { ArrayForEach } from './forEach';
import { ArrayIterator } from './iterator';
import { ArrayJoin } from './join';
import { ArrayLength } from './length';
import { ArrayMap } from './map';
import { ArrayPop } from './pop';
import { ArrayPush } from './push';
import { ArrayReduce } from './reduce';
import { ArraySlice } from './slice';
import { ArraySome } from './some';
import { ArrayToString } from './toString';

class ArrayInterface extends BuiltinInterface {}
class ReadonlyArrayInterface extends BuiltinInterface {}
class ArrayValue extends BuiltinInstanceOf {
  public readonly type = 'ArrayConstructor';
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

const COMMON: readonly (readonly [string, Builtin])[] = [
  ['filter', new ArrayFilter()] as const,
  ['forEach', new ArrayForEach()] as const,
  ['__@iterator', new ArrayIterator()] as const,
  ['length', new ArrayLength()] as const,
  ['map', new ArrayMap()] as const,
  ['reduce', new ArrayReduce()] as const,
  ['toString', new ArrayToString()] as const,
  ['concat', new ArrayConcat()] as const,
  ['join', new ArrayJoin()] as const,
  ['slice', new ArraySlice()] as const,
  ['some', new ArraySome()] as const,
  ['every', new ArrayEvery()] as const,
  ['entries', new ArrayEntries()] as const,
];

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addInterface('Array', new ArrayInterface());
  builtins.addInterface('ReadonlyArray', new ReadonlyArrayInterface());
  builtins.addValue('Array', new ArrayValue());
  COMMON.forEach(([name, builtin]) => {
    builtins.addGlobalMember('Array', name, builtin);
    builtins.addGlobalMember('ReadonlyArray', name, builtin);
  });
  builtins.addGlobalMember('Array', 'pop', new ArrayPop());
  builtins.addGlobalMember('Array', 'push', new ArrayPush());
  builtins.addInterface('ArrayConstructor', new ArrayConstructorInterface());
};
