import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberCall } from '../BuiltinInstanceMemberCall';
import { MemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class ArrayIterator extends BuiltinInstanceMemberCall {
  public canCall(): boolean {
    return true;
  }

  public emitCall(
    sb: ScriptBuilder,
    func: MemberLikeExpression,
    node: ts.CallExpression,
    options: VisitOptions,
    visited: boolean,
  ): void {
    if (!options.pushValue) {
      if (visited) {
        // []
        sb.emitOp(node, 'DROP');
      }

      return;
    }
    if (!visited && (ts.isPropertyAccessExpression(func) || ts.isElementAccessExpression(func))) {
      // [arrayVal]
      sb.visit(tsUtils.expression.getExpression(func), options);
    }

    // [val]
    sb.emitHelper(node, options, sb.helpers.createArrayIterableIterator);
  }
}
