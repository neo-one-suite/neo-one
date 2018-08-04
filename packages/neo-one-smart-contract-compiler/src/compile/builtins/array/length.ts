import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInMemberValue, BuiltInType } from '../types';

// tslint:disable-next-line export-name
export class ArrayLength extends BuiltInBase implements BuiltInMemberValue {
  public readonly types = new Set([BuiltInType.MemberValue]);

  public emitValue(
    sb: ScriptBuilder,
    node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
    options: VisitOptions,
    visited = false,
  ): void {
    if (!options.pushValue) {
      if (visited) {
        sb.emitOp(node, 'DROP');
      }

      return;
    }

    if (!visited) {
      // [arrayVal]
      sb.visit(tsUtils.expression.getExpression(node), options);
    }
    // [number]
    sb.emitHelper(node, options, sb.helpers.arrayLength);
    // [val]
    sb.emitHelper(node, options, sb.helpers.createNumber);
  }
}
