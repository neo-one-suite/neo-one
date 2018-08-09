import ts from 'typescript';
import { Context } from '../../../Context';
import { DiagnosticCode } from '../../../DiagnosticCode';
import { DiagnosticMessage } from '../../../DiagnosticMessage';
import { getHasBuiltins } from './getHasBuiltins';

export function handleTypeConversion(
  context: Context,
  fromNode: ts.Node,
  fromType: ts.Type | undefined,
  toNode: ts.Node,
  toType: ts.Type | undefined,
): void {
  if (fromType !== undefined && toType !== undefined) {
    const hasBuiltins = getHasBuiltins(context, fromNode, fromType);
    const mismatch = hasBuiltins.some((hasBuiltin) => !hasBuiltin(context, toNode, toType));
    if (mismatch) {
      context.reportError(fromNode, DiagnosticCode.InvalidBuiltinUsage, DiagnosticMessage.InvalidBuiltinAssignment);
    }
  }
}
