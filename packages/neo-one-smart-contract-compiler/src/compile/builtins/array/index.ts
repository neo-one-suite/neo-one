import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInInstanceOf, BuiltInType } from '../types';

export * from './filter';
export * from './forEach';
export * from './length';
export * from './map';
export * from './reduce';

export class ArrayInstance extends BuiltInBase implements BuiltInInstanceOf {
  public readonly types = new Set([BuiltInType.InstanceOf]);

  public emitInstanceOf(sb: ScriptBuilder, node: ts.Expression, options: VisitOptions): void {
    // [val]
    sb.visit(node, options);
    // [boolean]
    sb.emitHelper(node, options, sb.helpers.isArray);
    // [val]
    sb.emitHelper(node, options, sb.helpers.createBoolean);
  }
}
export class ArrayType extends BuiltInBase {}
