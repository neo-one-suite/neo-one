import {
  ExportDeclaration,
  ExportSpecifier,
  SyntaxKind,
  TypeGuards,
} from 'ts-simple-ast';

import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ExportDeclarationCompiler extends NodeCompiler<ExportDeclaration> {
  public readonly kind: SyntaxKind = SyntaxKind.ExportDeclaration;

  public visitNode(
    sb: ScriptBuilder,
    node: ExportDeclaration,
    optionsIn: VisitOptions,
  ): void {
    const options = sb.pushValueOptions(optionsIn);

    const getName = (namedExport: ExportSpecifier) => {
      let name = namedExport.getNameNode().getText();
      const alias = namedExport.getAliasIdentifier();
      if (alias != null) {
        name = alias.getText();
      }

      return name;
    };

    const moduleSpecifier = node.getModuleSpecifierSourceFile();

    // [exports]
    sb.emitHelper(node, options, sb.helpers.getCurrentModule);
    if (moduleSpecifier == null) {
      node
        .getNamedExports()
        .filter((namedExport) =>
          namedExport
            .getLocalTargetDeclarations()
            .some((decl) => !TypeGuards.isTypeAliasDeclaration(decl)),
        )
        .forEach((namedExport) => {
          // [exports, exports]
          sb.emitOp(node, 'DUP');
          // [val, exports, exports]
          sb.scope.get(sb, node, options, namedExport.getNameNode().getText());
          // [exports]
          sb.emitHelper(
            node,
            options,
            sb.helpers.export({ name: getName(namedExport) }),
          );
        });
    } else {
      // [moduleExports, exports]
      sb.loadModule(moduleSpecifier);
      node
        .getNamedExports()
        .filter((namedExport) =>
          sb.hasExport(moduleSpecifier, namedExport.getNameNode().getText()),
        )
        .forEach((namedExport) => {
          // [exports, moduleExports]
          sb.emitOp(node, 'SWAP');
          // [exports, moduleExports, exports]
          sb.emitOp(node, 'TUCK');
          // [moduleExports, exports, moduleExports, exports]
          sb.emitOp(node, 'OVER');
          // [name, moduleExports, exports, moduleExports, exports]
          sb.emitPushString(node, namedExport.getNameNode().getText());
          // [val, exports, moduleExports, exports]
          sb.emitOp(node, 'PICKITEM');
          // [moduleExports, exports]
          sb.emitHelper(
            node,
            options,
            sb.helpers.export({ name: getName(namedExport) }),
          );
        });
      // [exports]
      sb.emitOp(node, 'DROP');
    }

    // []
    sb.emitOp(node, 'DROP');
  }
}
