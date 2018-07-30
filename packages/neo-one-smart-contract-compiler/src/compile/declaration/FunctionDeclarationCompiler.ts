import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';

import { InternalFunctionProperties } from '../helper';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { Name } from '../scope';
import { VisitOptions } from '../types';

export class FunctionDeclarationCompiler extends NodeCompiler<ts.FunctionDeclaration> {
  public readonly kind = ts.SyntaxKind.FunctionDeclaration;

  public visitNode(sb: ScriptBuilder, decl: ts.FunctionDeclaration, optionsIn: VisitOptions): void {
    if (!tsUtils.overload.isImplementation(decl)) {
      return;
    }

    const options = sb.pushValueOptions(optionsIn);
    let name: Name | undefined;
    const declName = tsUtils.node.getName(decl);
    if (declName !== undefined) {
      name = sb.scope.add(tsUtils.node.getNameOrThrow(decl));
    }
    // [callArray]
    sb.emitHelper(decl, options, sb.helpers.createCallArray);
    // [callObjectVal]
    sb.emitHelper(
      decl,
      options,
      sb.helpers.createFunctionObject({
        property: InternalFunctionProperties.Call,
      }),
    );
    if (tsUtils.modifier.isNamedExport(decl) || tsUtils.modifier.isDefaultExport(decl)) {
      // [callObjectVal, callObjectVal]
      sb.emitOp(decl, 'DUP');
      // [callObjectVal]
      sb.emitHelper(
        decl,
        options,
        sb.helpers.exportSingle({
          name: tsUtils.modifier.isNamedExport(decl) ? tsUtils.node.getNameOrThrow(decl) : undefined,
          defaultExport: tsUtils.modifier.isDefaultExport(decl),
        }),
      );
    }
    if (name === undefined) {
      // []
      sb.emitOp(decl, 'DROP');
    } else {
      // []
      sb.scope.set(sb, decl, options, name);
    }
  }
}
