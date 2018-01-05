import { SyntaxKind, ImportDeclaration } from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ImportDeclarationCompiler extends NodeCompiler<ImportDeclaration> {
  public readonly kind: SyntaxKind = SyntaxKind.ImportDeclaration;

  public visitNode(
    sb: ScriptBuilder,
    node: ImportDeclaration,
    optionsIn: VisitOptions,
  ): void {
    const options = sb.pushValueOptions(optionsIn);
    // [exports]
    sb.loadModule(node.getModuleSpecifierSourceFileOrThrow());

    const namespaceImport = node.getNamespaceImport();
    if (namespaceImport != null) {
      const name = namespaceImport.getText();
      sb.scope.add(name);
      // [objectVal]
      sb.emitHelper(node, options, sb.helpers.createPropertyObject);

      // []
      sb.scope.set(sb, node, options, name);
    } else {
      const defaultImport = node.getDefaultImport();
      const namedImports = node
        .getNamedImports()
        .filter((namedImport) =>
          sb.hasExport(
            namedImport
              .getImportDeclaration()
              .getModuleSpecifierSourceFileOrThrow(),
            namedImport.getName(),
          ),
        );
      if (defaultImport != null) {
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
        for (const namedImport of namedImports) {
          // [exports, exports]
          sb.emitOp(node, 'DUP');
          // [name, exports, exports]
          sb.emitPushString(node, namedImport.getName());
          // [val, exports]
          sb.emitOp(node, 'PICKITEM');

          let name = namedImport.getName();
          const alias = namedImport.getAliasIdentifier();
          if (alias != null) {
            name = alias.getText();
          }
          sb.scope.add(name);

          // [exports]
          sb.scope.set(sb, node, options, name);
        }

        sb.emitOp(node, 'DROP');
      }
    }
  }
}
