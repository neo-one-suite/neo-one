import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInType, BuiltInValue } from '../types';

// tslint:disable-next-line export-name
export class ArrayLength extends BuiltInBase implements BuiltInValue {
  public readonly types = new Set([BuiltInType.Value]);

  public emitValue(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!ts.isPropertyAccessExpression(node)) {
      /* istanbul ignore next */
      sb.reportUnsupported(node);

      /* istanbul ignore next */
      return;
    }

    if (!options.pushValue) {
      return;
    }

    // [arrayVal]
    sb.visit(tsUtils.expression.getExpression(node), options);
    // [number]
    sb.emitHelper(node, options, sb.helpers.arrayLength);
    // [val]
    sb.emitHelper(node, options, sb.helpers.createNumber);
  }
}
