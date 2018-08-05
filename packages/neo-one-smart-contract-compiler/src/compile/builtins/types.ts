import ts from 'typescript';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export enum BuiltinType {
  Value = 'Value',
  MemberValue = 'MemberValue',
  Call = 'Call',
  Construct = 'Construct',
  InstanceOf = 'InstanceOf',
}

export interface Builtin {
  readonly types: Set<BuiltinType>;
  readonly canImplement: boolean;
}

export interface BuiltinValue extends Builtin {
  readonly emitValue: (sb: ScriptBuilder, node: ts.Identifier, options: VisitOptions) => void;
}

export function isBuiltinValue(value: Builtin): value is BuiltinValue {
  return value.types.has(BuiltinType.Value);
}

export type MemberLikeExpression = ts.PropertyAccessExpression | ts.ElementAccessExpression;
export interface BuiltinMemberValue extends Builtin {
  readonly emitValue: (sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions, visited?: boolean) => void;
}

export function isBuiltinMemberValue(value: Builtin): value is BuiltinMemberValue {
  return value.types.has(BuiltinType.MemberValue);
}

export type CallLikeExpression = ts.CallExpression | ts.TaggedTemplateExpression;
export interface BuiltinCall extends Builtin {
  readonly canCall: (sb: ScriptBuilder, node: CallLikeExpression, options: VisitOptions) => boolean;
  readonly emitCall: (sb: ScriptBuilder, node: CallLikeExpression, options: VisitOptions, visited?: boolean) => void;
}

export function isBuiltinCall(value: Builtin): value is BuiltinCall {
  return value.types.has(BuiltinType.Call);
}

export interface BuiltinConstruct extends Builtin {
  readonly emitConstruct: (sb: ScriptBuilder, node: ts.NewExpression, options: VisitOptions) => void;
}

export function isBuiltinConstruct(value: Builtin): value is BuiltinConstruct {
  return value.types.has(BuiltinType.Construct);
}

export interface BuiltinInstanceOf extends Builtin {
  readonly emitInstanceOf: (sb: ScriptBuilder, node: ts.Expression, options: VisitOptions) => void;
}

export function isBuiltinInstanceOf(value: Builtin): value is BuiltinInstanceOf {
  return value.types.has(BuiltinType.InstanceOf);
}

export class BuiltinBase {
  public readonly types: Set<BuiltinType> = new Set([]);
  public readonly canImplement: boolean = false;
}
