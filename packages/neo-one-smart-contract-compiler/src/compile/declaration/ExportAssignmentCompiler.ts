import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ExportAssignmentCompiler extends NodeCompiler<ts.ExportAssignment> {
  public readonly kind = ts.SyntaxKind.ExportAssignment;

  public visitNode(sb: ScriptBuilder, node: ts.ExportAssignment, optionsIn: VisitOptions): void {
    if (tsUtils.importExport.isExportEquals(node)) {
      sb.context.reportUnsupported(node);
    } else {
      const options = sb.pushValueOptions(optionsIn);
      // [val]
      sb.visit(tsUtils.expression.getExpression(node), options);
      // []
      sb.emitHelper(node, options, sb.helpers.exportSingle({ defaultExport: true }));
    }
  }
}
