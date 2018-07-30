import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class SourceFileCompiler extends NodeCompiler<ts.SourceFile> {
  public readonly kind = ts.SyntaxKind.SourceFile;

  public visitNode(sb: ScriptBuilder, node: ts.SourceFile, options: VisitOptions): void {
    tsUtils.file.getImportDeclarations(node).forEach((decl) => {
      sb.visit(decl, options);
    });
    sb.emitHelper(node, options, sb.helpers.processStatements({ createScope: false }));
    tsUtils.file.getExportDeclarations(node).forEach((decl) => {
      sb.visit(decl, options);
    });
    tsUtils.file.getExportAssignments(node).forEach((assignment) => {
      sb.visit(assignment, options);
    });
  }
}
