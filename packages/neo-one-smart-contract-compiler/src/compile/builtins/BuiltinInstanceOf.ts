import ts from 'typescript';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { BuiltinValueObject } from './BuiltinValueObject';
import { BuiltinInstanceOf as BuiltinInstanceOfType, BuiltinType } from './types';

export abstract class BuiltinInstanceOf extends BuiltinValueObject implements BuiltinInstanceOfType {
  public readonly types = new Set([BuiltinType.InstanceOf, BuiltinType.ValueObject]);
  public abstract emitInstanceOf(sb: ScriptBuilder, node: ts.Expression, options: VisitOptions): void;
}
