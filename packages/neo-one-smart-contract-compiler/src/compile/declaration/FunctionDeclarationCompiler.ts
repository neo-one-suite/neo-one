import { FunctionDeclaration, SyntaxKind } from 'ts-simple-ast';

import { InternalFunctionProperties } from '../helper';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class FunctionDeclarationCompiler extends NodeCompiler<
  FunctionDeclaration
> {
  public readonly kind: SyntaxKind = SyntaxKind.FunctionDeclaration;

  public visitNode(
    sb: ScriptBuilder,
    decl: FunctionDeclaration,
    optionsIn: VisitOptions,
  ): void {
    if (!decl.isImplementation()) {
      return;
    }

    const options = sb.pushValueOptions(optionsIn);
    const name = sb.scope.add(decl.getName());
    // [callArray]
    sb.emitHelper(decl, options, sb.helpers.createCallArray);
    // [callObjectVal]
    sb.emitHelper(
      decl,
      options,
      sb.helpers.createFunctionObject({
        property: InternalFunctionProperties.CALL,
      }),
    );
    if (decl.isNamedExport() || decl.isDefaultExport()) {
      // [callObjectVal, callObjectVal]
      sb.emitOp(decl, 'DUP');
      // [callObjectVal]
      sb.emitHelper(
        decl,
        options,
        sb.helpers.exportSingle({
          name: decl.isNamedExport() ? decl.getName() : undefined,
          defaultExport: decl.isDefaultExport(),
        }),
      );
    }
    // []
    sb.scope.set(sb, decl, options, name);
  }
}
