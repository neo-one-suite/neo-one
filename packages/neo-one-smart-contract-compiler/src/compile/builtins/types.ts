import ts from 'typescript';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export enum BuiltInType {
  Value = 'Value',
  Call = 'Call',
  Construct = 'Construct',
  InstanceOf = 'InstanceOf',
  Extend = 'Extend',
}

export interface BuiltIn {
  readonly types: Set<BuiltInType>;
  readonly canImplement: boolean;
}

export interface BuiltInValue extends BuiltIn {
  readonly emitValue: (sb: ScriptBuilder, node: ts.Node, options: VisitOptions) => void;
}

export function isBuiltInValue(value: BuiltIn): value is BuiltInValue {
  return value.types.has(BuiltInType.Value);
}

export interface BuiltInCall extends BuiltIn {
  readonly emitCall: (sb: ScriptBuilder, node: ts.CallExpression, options: VisitOptions) => void;
}

export function isBuiltInCall(value: BuiltIn): value is BuiltInCall {
  return value.types.has(BuiltInType.Call);
}

export interface BuiltInConstruct extends BuiltIn {
  readonly emitConstruct: (sb: ScriptBuilder, node: ts.NewExpression, options: VisitOptions) => void;
}

export function isBuiltInConstruct(value: BuiltIn): value is BuiltInConstruct {
  return value.types.has(BuiltInType.Construct);
}

export interface BuiltInInstanceOf extends BuiltIn {
  readonly emitInstanceOf: (sb: ScriptBuilder, node: ts.Expression, options: VisitOptions) => void;
}

export function isBuiltInInstanceOf(value: BuiltIn): value is BuiltInInstanceOf {
  return value.types.has(BuiltInType.InstanceOf);
}

export interface BuiltInExtend extends BuiltIn {
  readonly emitExtend: (sb: ScriptBuilder, node: ts.Node, options: VisitOptions) => void;
}

export function isBuiltInExtend(value: BuiltIn): value is BuiltInExtend {
  return value.types.has(BuiltInType.Extend);
}

export class BuiltInBase {
  public readonly types: Set<BuiltInType> = new Set([]);
  public readonly canImplement: boolean = false;
}
