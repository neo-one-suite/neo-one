import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInInstanceOf, BuiltInType } from '../types';

export * from './concat';
export * from './equals';
export * from './from';
export * from './length';

export class BufferInstance extends BuiltInBase implements BuiltInInstanceOf {
  public readonly types = new Set([BuiltInType.InstanceOf]);

  public emitInstanceOf(sb: ScriptBuilder, node: ts.Expression, options: VisitOptions): void {
    // [val]
    sb.visit(node, options);
    // [boolean]
    sb.emitHelper(node, options, sb.helpers.isBuffer);
    // [val]
    sb.emitHelper(node, options, sb.helpers.createBoolean);
  }
}
export class BufferType extends BuiltInBase {}
