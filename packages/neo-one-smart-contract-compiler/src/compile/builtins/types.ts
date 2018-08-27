import ts from 'typescript';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export enum BuiltinType {
  Value = 'Value',
  ValueObject = 'ValueObject',
  MemberValue = 'MemberValue',
  InstanceMemberValue = 'InstanceMemberValue',
  Call = 'Call',
  MemberCall = 'MemberCall',
  InstanceMemberCall = 'InstanceMemberCall',
  Template = 'Template',
  MemberTemplate = 'MemberTemplate',
  InstanceMemberTemplate = 'InstanceMemberTemplate',
  InstanceOf = 'InstanceOf',
  Interface = 'Interface',
}

export interface Builtin {
  readonly types: Set<BuiltinType>;
}

export interface BuiltinInterface extends Builtin {
  readonly canImplement: boolean;
}

export function isBuiltinInterface(value: Builtin): value is BuiltinInterface {
  return value.types.has(BuiltinType.Interface);
}

export interface BuiltinValue extends Builtin {
  readonly emitValue: (sb: ScriptBuilder, node: ts.Identifier, options: VisitOptions) => void;
}

export function isBuiltinValue(value: Builtin): value is BuiltinValue {
  return value.types.has(BuiltinType.Value);
}

export type MemberLikeExpression = ts.PropertyAccessExpression | ts.ElementAccessExpression | ts.BindingElement;
export interface BuiltinMemberValue extends Builtin {
  readonly emitValue: (sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions) => void;
}

export function isBuiltinMemberValue(value: Builtin): value is BuiltinMemberValue {
  return value.types.has(BuiltinType.MemberValue);
}

export interface BuiltinInstanceMemberValue extends Builtin {
  readonly emitValue: (sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions, visited: boolean) => void;
}

export function isBuiltinInstanceMemberValue(value: Builtin): value is BuiltinInstanceMemberValue {
  return value.types.has(BuiltinType.InstanceMemberValue);
}

export interface BuiltinCall extends Builtin {
  readonly emitCall: (sb: ScriptBuilder, node: ts.CallExpression, options: VisitOptions) => void;
}

export function isBuiltinCall(value: Builtin): value is BuiltinCall {
  return value.types.has(BuiltinType.Call);
}

export interface BuiltinTemplate extends Builtin {
  readonly emitCall: (sb: ScriptBuilder, node: ts.TaggedTemplateExpression, options: VisitOptions) => void;
}

export function isBuiltinTemplate(value: Builtin): value is BuiltinTemplate {
  return value.types.has(BuiltinType.Template);
}

export type CallMemberLikeExpression = ts.PropertyAccessExpression | ts.ElementAccessExpression;
export interface BuiltinMemberTemplate extends Builtin {
  readonly emitCall: (
    sb: ScriptBuilder,
    func: CallMemberLikeExpression,
    node: ts.TaggedTemplateExpression,
    options: VisitOptions,
  ) => void;
}

export function isBuiltinMemberTemplate(value: Builtin): value is BuiltinMemberTemplate {
  return value.types.has(BuiltinType.MemberTemplate);
}

export interface BuiltinInstanceMemberTemplate extends Builtin {
  readonly canCall: (
    sb: ScriptBuilder,
    func: CallMemberLikeExpression,
    node: ts.TaggedTemplateExpression,
    options: VisitOptions,
  ) => boolean;
  readonly emitCall: (
    sb: ScriptBuilder,
    func: CallMemberLikeExpression,
    node: ts.TaggedTemplateExpression,
    options: VisitOptions,
    visited: boolean,
  ) => void;
}

export function isBuiltinInstanceMemberTemplate(value: Builtin): value is BuiltinInstanceMemberTemplate {
  return value.types.has(BuiltinType.InstanceMemberTemplate);
}

export interface BuiltinMemberCall extends Builtin {
  readonly emitCall: (
    sb: ScriptBuilder,
    func: CallMemberLikeExpression,
    node: ts.CallExpression,
    options: VisitOptions,
  ) => void;
}

export function isBuiltinMemberCall(value: Builtin): value is BuiltinMemberCall {
  return value.types.has(BuiltinType.MemberCall);
}

export interface BuiltinInstanceMemberCall extends Builtin {
  readonly canCall: (
    sb: ScriptBuilder,
    func: CallMemberLikeExpression,
    node: ts.CallExpression,
    options: VisitOptions,
  ) => boolean;
  readonly emitCall: (
    sb: ScriptBuilder,
    func: CallMemberLikeExpression,
    node: ts.CallExpression,
    options: VisitOptions,
    visited: boolean,
  ) => void;
}

export function isBuiltinInstanceMemberCall(value: Builtin): value is BuiltinInstanceMemberCall {
  return value.types.has(BuiltinType.InstanceMemberCall);
}

export interface BuiltinInstanceOf extends Builtin {
  readonly emitInstanceOf: (sb: ScriptBuilder, node: ts.Expression, options: VisitOptions) => void;
}

export function isBuiltinInstanceOf(value: Builtin): value is BuiltinInstanceOf {
  return value.types.has(BuiltinType.InstanceOf);
}

export interface BuiltinValueObject extends Builtin {
  readonly type: string;
}

export function isBuiltinValueObject(value: Builtin): value is BuiltinValueObject {
  return value.types.has(BuiltinType.ValueObject);
}
