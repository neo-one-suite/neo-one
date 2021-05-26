import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinInstanceMemberCall } from '../BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class MapIterator extends BuiltinInstanceMemberCall {
  public canCall(): boolean {
    return true;
  }

  public emitCall(
    sb: ScriptBuilder,
    func: CallMemberLikeExpression,
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
    if (!visited) {
      // [arrayVal]
      sb.visit(tsUtils.expression.getExpression(func), options);
    }

    // [map]
    sb.emitHelper(node, options, sb.helpers.unwrapMap);
    // [iterator]
    sb.emitHelper(node, options, sb.helpers.createMapIterator);
    // [val]
    sb.emitHelper(node, options, sb.helpers.createIteratorIterableIterator({ deserializeKey: true }));
  }
}
