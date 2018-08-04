import ts from 'typescript';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export enum BuiltInType {
  Value = 'Value',
  MemberValue = 'MemberValue',
  Call = 'Call',
  Construct = 'Construct',
  InstanceOf = 'InstanceOf',
}

export interface BuiltIn {
  readonly types: Set<BuiltInType>;
  readonly canImplement: boolean;
}

export interface BuiltInValue extends BuiltIn {
  readonly emitValue: (sb: ScriptBuilder, node: ts.Identifier, options: VisitOptions) => void;
}

export function isBuiltInValue(value: BuiltIn): value is BuiltInValue {
  return value.types.has(BuiltInType.Value);
}

export interface BuiltInMemberValue extends BuiltIn {
  readonly emitValue: (
    sb: ScriptBuilder,
    node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
    options: VisitOptions,
    visited?: boolean,
  ) => void;
}

export function isBuiltInMemberValue(value: BuiltIn): value is BuiltInMemberValue {
  return value.types.has(BuiltInType.MemberValue);
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

export class BuiltInBase {
  public readonly types: Set<BuiltInType> = new Set([]);
  public readonly canImplement: boolean = false;
}
