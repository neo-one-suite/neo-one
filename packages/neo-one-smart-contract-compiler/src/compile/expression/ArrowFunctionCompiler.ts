import { ArrowFunction, SyntaxKind } from 'ts-simple-ast';

import { InternalFunctionProperties } from '../helper';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ArrowFunctionCompiler extends NodeCompiler<ArrowFunction> {
  public readonly kind: SyntaxKind = SyntaxKind.ArrowFunction;

  public visitNode(sb: ScriptBuilder, expr: ArrowFunction, options: VisitOptions): void {
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
