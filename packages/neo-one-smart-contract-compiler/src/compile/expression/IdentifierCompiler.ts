import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { DiagnosticCode } from '../../DiagnosticCode';
import { DiagnosticMessage } from '../../DiagnosticMessage';
import { isBuiltinValue } from '../builtins';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class IdentifierCompiler extends NodeCompiler<ts.Identifier> {
  public readonly kind = ts.SyntaxKind.Identifier;

  public visitNode(sb: ScriptBuilder, expr: ts.Identifier, options: VisitOptions): void {
    const builtin = sb.builtins.getValue(sb.context, expr);
    if (builtin !== undefined) {
      if (!isBuiltinValue(builtin)) {
        sb.reportError(expr, DiagnosticCode.InvalidBuiltinReference, DiagnosticMessage.CannotReferenceBuiltin);

        return;
      }

      if (options.setValue) {
        /* istanbul ignore next */
        sb.reportError(expr, DiagnosticCode.InvalidBuiltinReference, DiagnosticMessage.CannotModifyBuiltin);

        /* istanbul ignore next */
        return;
      }

      builtin.emitValue(sb, expr, options);

      return;
    }

    const symbol = sb.getSymbol(expr);
    if (symbol !== undefined && tsUtils.symbol.isArgumentsSymbol(sb.typeChecker, symbol)) {
      sb.reportError(expr, DiagnosticCode.InvalidBuiltinReference, DiagnosticMessage.CannotReferenceBuiltin);

      return;
    }

    if (options.setValue) {
      sb.scope.set(sb, expr, sb.noSetValueOptions(options), expr.getText());
    }

    if (options.pushValue) {
      if (tsUtils.identifier.isUndefined(expr)) {
        sb.emitHelper(expr, options, sb.helpers.createUndefined);
      } else {
        sb.scope.get(sb, expr, options, expr.getText());
      }
    }
  }
}
