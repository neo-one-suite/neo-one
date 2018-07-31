import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { Name } from '../../scope';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { InternalFunctionProperties } from './InternalFunctionProperties';

// Input: []
// Output: [farr]
export class FunctionLikeHelper extends Helper<ts.FunctionDeclaration | ts.FunctionExpression> {
  public emit(sb: ScriptBuilder, node: ts.FunctionDeclaration | ts.FunctionExpression, optionsIn: VisitOptions): void {
    if (!tsUtils.overload.isImplementation(node)) {
      return;
    }

    const options = sb.pushValueOptions(optionsIn);
    let name: Name | undefined;
    const nodeName = tsUtils.node.getName(node);
    if (nodeName !== undefined) {
      name = sb.scope.add(tsUtils.node.getNameOrThrow(node));
    }
    // [callArray]
    sb.emitHelper(node, options, sb.helpers.createCallArray);
    // [callObjectVal]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createFunctionObject({
        property: InternalFunctionProperties.Call,
      }),
    );
    if (tsUtils.modifier.isNamedExport(node) || tsUtils.modifier.isDefaultExport(node)) {
      // [callObjectVal, callObjectVal]
      sb.emitOp(node, 'DUP');
      // [callObjectVal]
      sb.emitHelper(
        node,
        options,
        sb.helpers.exportSingle({
          name: tsUtils.modifier.isNamedExport(node) ? tsUtils.node.getNameOrThrow(node) : undefined,
          defaultExport: tsUtils.modifier.isDefaultExport(node),
        }),
      );
    }
    if (name === undefined) {
      if (!optionsIn.pushValue) {
        // []
        sb.emitOp(node, 'DROP');
      }
    } else {
      // []
      sb.scope.set(sb, node, options, name);
    }
  }
}
