import ts from 'typescript';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { BuiltinMemberCall as BuiltinMemberCallType, BuiltinType, MemberLikeExpression } from './types';

export abstract class BuiltinMemberCall implements BuiltinMemberCallType {
  public readonly types = new Set([BuiltinType.MemberCall]);

  public abstract emitCall(
    sb: ScriptBuilder,
    func: MemberLikeExpression,
    node: ts.CallExpression,
    options: VisitOptions,
  ): void;
}
