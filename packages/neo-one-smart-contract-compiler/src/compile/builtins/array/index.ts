import ts from 'typescript';
import { Context } from '../../../Context';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Builtins } from '../Builtins';
import { BuiltinBase, BuiltinInstanceOf, BuiltinType } from '../types';
import { ArrayFilter } from './filter';
import { ArrayForEach } from './forEach';
import { ArrayIterator } from './iterator';
import { ArrayLength } from './length';
import { ArrayMap } from './map';
import { ArrayReduce } from './reduce';

class ArrayInstance extends BuiltinBase implements BuiltinInstanceOf {
  public readonly types = new Set([BuiltinType.InstanceOf]);

  public emitInstanceOf(sb: ScriptBuilder, node: ts.Expression, options: VisitOptions): void {
    // [val]
    sb.visit(node, options);
    // [boolean]
    sb.emitHelper(node, options, sb.helpers.isArray);
    // [val]
    sb.emitHelper(node, options, sb.helpers.createBoolean);
  }
}
class ArrayConstructor extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (context: Context, builtins: Builtins): void => {
  builtins.addInterface(context, 'Array', new ArrayInstance());
  builtins.addValue(context, 'Array', new ArrayInstance());
  builtins.addMember(context, 'Array', 'filter', new ArrayFilter());
  builtins.addMember(context, 'Array', 'forEach', new ArrayForEach());
  builtins.addMember(context, 'Array', '__@iterator', new ArrayIterator());
  builtins.addMember(context, 'Array', 'length', new ArrayLength());
  builtins.addMember(context, 'Array', 'map', new ArrayMap());
  builtins.addMember(context, 'Array', 'reduce', new ArrayReduce());
  builtins.addInterface(context, 'ArrayConstructor', new ArrayConstructor());
};
