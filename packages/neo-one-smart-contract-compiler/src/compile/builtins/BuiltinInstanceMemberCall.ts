import ts from 'typescript';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { BuiltinInstanceMemberCall as BuiltinInstanceMemberCallType, BuiltinType, MemberLikeExpression } from './types';

// tslint:disable-next-line export-name
export abstract class BuiltinInstanceMemberCall implements BuiltinInstanceMemberCallType {
  public readonly types = new Set([BuiltinType.InstanceMemberCall]);
  public abstract canCall(
    sb: ScriptBuilder,
    func: MemberLikeExpression,
    node: ts.CallExpression,
    options: VisitOptions,
  ): boolean;
  public abstract emitCall(
    sb: ScriptBuilder,
    func: MemberLikeExpression,
    node: ts.CallExpression,
    options: VisitOptions,
    visited: boolean,
  ): void;
}
