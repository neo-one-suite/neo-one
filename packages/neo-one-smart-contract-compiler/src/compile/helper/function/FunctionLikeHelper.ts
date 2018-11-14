import { BodiedNode, ParameteredNode, tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { InternalObjectProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { Name } from '../../scope';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [farr]
export class FunctionLikeHelper extends Helper<ts.FunctionDeclaration | ts.FunctionExpression> {
  public emit(sb: ScriptBuilder, node: ts.FunctionDeclaration | ts.FunctionExpression, optionsIn: VisitOptions): void {
    if (!tsUtils.overload.isImplementation(node)) {
      return;
    }
    if (sb.context.analysis.isSmartContractMixinFunction(node)) {
      return;
    }
    // tslint:disable-next-line no-any
    const func: BodiedNode & ParameteredNode = node as any;

    const options = sb.pushValueOptions(optionsIn);
    let name: Name | undefined;
    const nodeName = tsUtils.node.getName(node);
    if (nodeName !== undefined) {
      name = sb.scope.add(tsUtils.node.getNameOrThrow(node));
    }
    // [callArray]
    sb.emitHelper(func, options, sb.helpers.createCallArray);
    // [callObjectVal]
    sb.emitHelper(
      func,
      options,
      sb.helpers.createFunctionObject({
        property: InternalObjectProperty.Call,
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

    if (!optionsIn.pushValue) {
      if (name === undefined) {
        // []
        sb.emitOp(node, 'DROP');
      } else {
        // []
        sb.scope.set(sb, node, options, name);
      }
    }
  }
}
