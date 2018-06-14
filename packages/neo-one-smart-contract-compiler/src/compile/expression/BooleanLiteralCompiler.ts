import { BooleanLiteral, SyntaxKind } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export abstract class BooleanLiteralCompiler extends NodeCompiler<BooleanLiteral> {
  protected abstract readonly value: boolean;

  public visitNode(sb: ScriptBuilder, expr: BooleanLiteral, options: VisitOptions): void {
    if (options.pushValue) {
      sb.emitPushBoolean(expr, this.value);
      sb.emitHelper(expr, options, sb.helpers.createBoolean);
    }
  }
}

export class TrueBooleanLiteralCompiler extends BooleanLiteralCompiler {
  public readonly kind: SyntaxKind = SyntaxKind.TrueKeyword;
  protected readonly value = true;
}

export class FalseBooleanLiteralCompiler extends BooleanLiteralCompiler {
  public readonly kind: SyntaxKind = SyntaxKind.FalseKeyword;
  protected readonly value = false;
}
