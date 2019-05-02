import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ImportDeclarationCompiler extends NodeCompiler<ts.ImportDeclaration> {
  public readonly kind = ts.SyntaxKind.ImportDeclaration;

  public visitNode(sb: ScriptBuilder, node: ts.ImportDeclaration, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const sourceFile = tsUtils.importExport.getModuleSpecifierSourceFile(sb.context.typeChecker, node);
    if (sourceFile === undefined) {
      /* istanbul ignore next */
      return;
    }

    if (tsUtils.file.isDeclarationFile(sourceFile)) {
      return;
    }

    if (!tsUtils.importExport.hasValueReference(sb.context.program, sb.context.languageService, node)) {
      return;
    }

    // [exports]
    sb.loadModule(sourceFile);

    const namespaceImport = tsUtils.importDeclaration.getNamespaceImportIdentifier(node);
    if (namespaceImport !== undefined) {
      const name = namespaceImport.getText();
      sb.scope.add(name);
      // [objectVal]
      sb.emitHelper(node, options, sb.helpers.createPropertyObject);

      // []
      sb.scope.set(sb, node, options, name);
    } else {
      const defaultImport = tsUtils.importDeclaration.getDefaultImport(node);
      const namedImports = this.getExportedNamedImports(sb, node, sourceFile);
      if (defaultImport !== undefined) {
        if (namedImports.length > 0) {
          // [exports, exports]
          sb.emitOp(node, 'DUP');
        }

        // ['default', exports]
        sb.emitPushString(node, 'default');
        // [val]
        sb.emitOp(node, 'PICKITEM');

        const name = defaultImport.getText();
        sb.scope.add(name);

        // []
        sb.scope.set(sb, node, options, name);
      }

      if (namedImports.length > 0) {
        namedImports.forEach((namedImport) => {
          const importName = this.getImportName(namedImport);

          // [exports, exports]
          sb.emitOp(node, 'DUP');
          // [name, exports, exports]
          sb.emitPushString(node, importName);
          // [val, exports]
          sb.emitOp(node, 'PICKITEM');

          const name = tsUtils.node.getName(namedImport);
          sb.scope.add(name);

          // [exports]
          sb.scope.set(sb, node, options, name);
        });

        sb.emitOp(node, 'DROP');
      }
    }
  }

  private getExportedNamedImports(
    sb: ScriptBuilder,
    node: ts.ImportDeclaration,
    sourceFile: ts.SourceFile,
  ): readonly ts.ImportSpecifier[] {
    return tsUtils.importDeclaration
      .getNamedImports(node)
      .filter((namedImport) => sb.hasExport(sourceFile, this.getImportName(namedImport)));
  }

  private getImportName(node: ts.ImportSpecifier): string {
    const alias = tsUtils.node.getPropertyNameNode(node);

    return alias === undefined ? tsUtils.node.getName(node) : tsUtils.node.getText(alias);
  }
}
