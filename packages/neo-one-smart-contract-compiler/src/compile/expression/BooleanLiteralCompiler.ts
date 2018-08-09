import ts from 'typescript';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export abstract class BooleanLiteralCompiler extends NodeCompiler<ts.BooleanLiteral> {
  protected abstract readonly value: boolean;

  public visitNode(sb: ScriptBuilder, expr: ts.BooleanLiteral, options: VisitOptions): void {
    if (options.pushValue) {
      sb.emitPushBoolean(expr, this.value);
      sb.emitHelper(expr, options, sb.helpers.wrapBoolean);
    }
  }
}

export class TrueBooleanLiteralCompiler extends BooleanLiteralCompiler {
  public readonly kind = ts.SyntaxKind.TrueKeyword;
  protected readonly value = true;
}

export class FalseBooleanLiteralCompiler extends BooleanLiteralCompiler {
  public readonly kind = ts.SyntaxKind.FalseKeyword;
  protected readonly value = false;
}
