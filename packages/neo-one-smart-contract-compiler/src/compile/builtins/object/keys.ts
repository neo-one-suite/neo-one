import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInCall, BuiltInType } from '../types';

// tslint:disable-next-line export-name
export class ObjectKeys extends BuiltInBase implements BuiltInCall {
  public readonly types = new Set([BuiltInType.Call]);
  public emitCall(sb: ScriptBuilder, node: ts.CallExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const arg = tsUtils.argumented.getArguments(node)[0];
    // [val]
    sb.visit(arg, options);
    // [objectVal]
    sb.emitHelper(node, options, sb.helpers.toObject({ type: sb.getType(arg) }));
    // [arr]
    sb.emitHelper(node, options, sb.helpers.getPropertyObjectKeys);
    // [arr]
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrMap({
        map: () => {
          // [val]
          sb.emitHelper(node, options, sb.helpers.createString);
        },
      }),
    );
    // [arrayVal]
    sb.emitHelper(node, options, sb.helpers.wrapArray);
    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
