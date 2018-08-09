import ts from 'typescript';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { BuiltinCall as BuiltinCallType, BuiltinType } from './types';

export abstract class BuiltinCall implements BuiltinCallType {
  public readonly types = new Set([BuiltinType.Call]);

  public abstract emitCall(sb: ScriptBuilder, node: ts.CallExpression, options: VisitOptions): void;
}
