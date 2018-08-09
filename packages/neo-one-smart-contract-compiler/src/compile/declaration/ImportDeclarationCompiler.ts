import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { DiagnosticCode } from '../../DiagnosticCode';
import { DiagnosticMessage } from '../../DiagnosticMessage';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ImportDeclarationCompiler extends NodeCompiler<ts.ImportDeclaration> {
  public readonly kind = ts.SyntaxKind.ImportDeclaration;

  public visitNode(sb: ScriptBuilder, node: ts.ImportDeclaration, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const sourceFile = tsUtils.importExport.getModuleSpecifierSourceFile(sb.context.typeChecker, node);
    if (sourceFile === undefined) {
      const specifier = tsUtils.importExport.getModuleSpecifier(node);
      sb.context.reportError(
        node,
        DiagnosticCode.UnknownModule,
        DiagnosticMessage.UnknownModule,
        specifier === undefined ? 'unknown' : tsUtils.literal.getLiteralValue(specifier),
      );

      return;
    }

    if (tsUtils.file.isDeclarationFile(sourceFile)) {
      return;
    }

    // [exports]
    sb.loadModule(sourceFile);

    const namespaceImport = tsUtils.importDeclaration.getNamespaceImport(node);
    if (namespaceImport !== undefined) {
      const name = namespaceImport.getText();
      sb.scope.add(name);
      // [objectVal]
      sb.emitHelper(node, options, sb.helpers.createPropertyObject);

      // []
      sb.scope.set(sb, node, options, name);
    } else {
      const getImportName = (namedImport: ts.ImportSpecifier) => {
        const alias = tsUtils.node.getPropertyNameNode(namedImport);

        return alias === undefined ? tsUtils.node.getName(namedImport) : tsUtils.node.getText(alias);
      };

      const defaultImport = tsUtils.importDeclaration.getDefaultImport(node);
      const namedImports = tsUtils.importDeclaration
        .getNamedImports(node)
        .filter((namedImport) => sb.hasExport(sourceFile, getImportName(namedImport)));
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
          const importName = getImportName(namedImport);

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
}
