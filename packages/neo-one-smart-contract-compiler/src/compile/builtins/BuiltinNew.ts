import ts from 'typescript';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { BuiltinInstanceOf } from './BuiltinInstanceOf';
import { BuiltinNew as BuiltinNewType, BuiltinType } from './types';

export abstract class BuiltinNew extends BuiltinInstanceOf implements BuiltinNewType {
  public readonly types = new Set([BuiltinType.InstanceOf, BuiltinType.New]);
  public abstract emitNew(sb: ScriptBuilder, node: ts.NewExpression, options: VisitOptions): void;
}
