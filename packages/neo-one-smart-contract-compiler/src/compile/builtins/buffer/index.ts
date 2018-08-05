import ts from 'typescript';
import { Context } from '../../../Context';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Builtins } from '../Builtins';
import { BuiltinBase, BuiltinInstanceOf, BuiltinType } from '../types';
import { BufferConcat } from './concat';
import { BufferEquals } from './equals';
import { BufferFrom } from './from';
import { BufferLength } from './length';

class BufferInstance extends BuiltinBase implements BuiltinInstanceOf {
  public readonly types = new Set([BuiltinType.InstanceOf]);

  public emitInstanceOf(sb: ScriptBuilder, node: ts.Expression, options: VisitOptions): void {
    // [val]
    sb.visit(node, options);
    // [boolean]
    sb.emitHelper(node, options, sb.helpers.isBuffer);
    // [val]
    sb.emitHelper(node, options, sb.helpers.createBoolean);
  }
}
class BufferConstructor extends BuiltinBase {}

// tslint:disable-next-line export-name
export const add = (context: Context, builtins: Builtins): void => {
  builtins.addInterface(context, 'Buffer', new BufferInstance());
  builtins.addValue(context, 'Buffer', new BufferInstance());
  builtins.addMember(context, 'Buffer', 'equals', new BufferEquals());
  builtins.addMember(context, 'Buffer', 'length', new BufferLength());
  builtins.addInterface(context, 'BufferConstructor', new BufferConstructor());
  builtins.addMember(context, 'BufferConstructor', 'concat', new BufferConcat());
  builtins.addMember(context, 'BufferConstructor', 'from', new BufferFrom());
};
