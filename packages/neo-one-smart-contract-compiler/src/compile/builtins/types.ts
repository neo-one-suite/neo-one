import ts from 'typescript';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class BuiltIn {
  public readonly canReference: boolean = false;
  public readonly canImplement: boolean = false;
  public readonly canExtend: boolean = false;
}

export abstract class BuiltInValue extends BuiltIn {
  public readonly canReference = true;
  public abstract emitValue(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void;
}

export abstract class BuiltInCallable extends BuiltIn {
  public abstract emitCall(sb: ScriptBuilder, node: ts.CallExpression, options: VisitOptions): void;
}
