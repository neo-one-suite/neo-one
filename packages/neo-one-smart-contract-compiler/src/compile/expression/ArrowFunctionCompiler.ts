import ts from 'typescript';

import { InternalFunctionProperties } from '../helper';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ArrowFunctionCompiler extends NodeCompiler<ts.ArrowFunction> {
  public readonly kind = ts.SyntaxKind.ArrowFunction;

  public visitNode(sb: ScriptBuilder, expr: ts.ArrowFunction, options: VisitOptions): void {
    if (options.pushValue) {
      // [this]
      sb.scope.getThis(sb, expr, options);
      // [callArray, this]
      sb.emitHelper(expr, options, sb.helpers.createCallArray);
      // [callArray]
      sb.emitHelper(expr, options, sb.helpers.bindFunctionThis({ overwrite: true }));
      // [callObjectVal]
      sb.emitHelper(
        expr,
        options,
        sb.helpers.createFunctionObject({
          property: InternalFunctionProperties.Call,
        }),
      );
    }
  }
}
