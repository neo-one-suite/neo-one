import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ExportDeclarationCompiler extends NodeCompiler<ts.ExportDeclaration> {
  public readonly kind = ts.SyntaxKind.ExportDeclaration;

  public visitNode(sb: ScriptBuilder, node: ts.ExportDeclaration, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    const getName = (namedExport: ts.ExportSpecifier) => {
      let name = tsUtils.node.getName(namedExport);
      const alias = tsUtils.importExport.getAliasName(namedExport);
      if (alias !== undefined) {
        name = alias;
      }

      return name;
    };

    const getExportName = (namedExport: ts.ExportSpecifier) => tsUtils.node.getName(namedExport);

    const moduleSpecifier = tsUtils.importExport.getModuleSpecifierSourceFile(sb.typeChecker, node);

    // [exports]
    sb.emitHelper(node, options, sb.helpers.getCurrentModule);
    if (moduleSpecifier === undefined) {
      tsUtils.exportDeclaration
        .getNamedExports(node)
        .filter((namedExport) =>
          tsUtils.exportSpecifier
            .getLocalTargetDeclarations(sb.typeChecker, namedExport)
            .some((decl) => !tsUtils.declaration.isAmbient(decl)),
        )
        .filter((namedExport) => {
          const symbol = sb.getSymbol(namedExport);

          return (
            symbol !== undefined &&
            tsUtils.symbol.getDeclarations(symbol).some((decl) => !tsUtils.declaration.isAmbient(decl))
          );
        })
        .forEach((namedExport) => {
          // [exports, exports]
          sb.emitOp(node, 'DUP');
          // [val, exports, exports]
          sb.scope.get(sb, node, options, getName(namedExport));
          // [exports]
          sb.emitHelper(node, options, sb.helpers.export({ name: getExportName(namedExport) }));
        });
    } else {
      // [moduleExports, exports]
      sb.loadModule(moduleSpecifier);
      tsUtils.exportDeclaration
        .getNamedExports(node)
        .filter((namedExport) => sb.hasExport(moduleSpecifier, getName(namedExport)))
        .forEach((namedExport) => {
          // [exports, moduleExports]
          sb.emitOp(node, 'SWAP');
          // [exports, moduleExports, exports]
          sb.emitOp(node, 'TUCK');
          // [moduleExports, exports, moduleExports, exports]
          sb.emitOp(node, 'OVER');
          // [name, moduleExports, exports, moduleExports, exports]
          sb.emitPushString(node, getName(namedExport));
          // [val, exports, moduleExports, exports]
          sb.emitOp(node, 'PICKITEM');
          // [moduleExports, exports]
          sb.emitHelper(node, options, sb.helpers.export({ name: getExportName(namedExport) }));
        });
      // [exports]
      sb.emitOp(node, 'DROP');
    }

    // []
    sb.emitOp(node, 'DROP');
  }
}
