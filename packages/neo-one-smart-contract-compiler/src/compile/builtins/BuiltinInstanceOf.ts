import ts from 'typescript';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { BuiltinInstanceOf as BuiltinInstanceOfType, BuiltinType } from './types';

export abstract class BuiltinInstanceOf implements BuiltinInstanceOfType {
  public readonly types = new Set([BuiltinType.InstanceOf]);
  public abstract emitInstanceOf(sb: ScriptBuilder, node: ts.Expression, options: VisitOptions): void;
}
