import { SyntaxKind, ExportAssignment } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ExportAssignmentCompiler extends NodeCompiler<ExportAssignment> {
  public readonly kind: SyntaxKind = SyntaxKind.ExportAssignment;

  public visitNode(
    sb: ScriptBuilder,
    node: ExportAssignment,
    optionsIn: VisitOptions,
  ): void {
    if (node.isExportEquals()) {
      sb.reportUnsupported(node);
    } else {
      const options = sb.pushValueOptions(optionsIn);
      // [val]
      sb.visit(node.getExpression(), options);
      // []
      sb.emitHelper(
        node,
        options,
        sb.helpers.exportSingle({ defaultExport: true }),
      );
    }
  }
}
