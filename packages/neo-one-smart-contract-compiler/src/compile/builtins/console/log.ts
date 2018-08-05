import { tsUtils } from '@neo-one/ts-utils';
import _ from 'lodash';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInCall, BuiltInType, CallLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class ConsoleLog extends BuiltInBase implements BuiltInCall {
  public readonly types = new Set([BuiltInType.Call]);
  public canCall(): boolean {
    throw new Error('Something went wrong.');
  }

  public emitCall(sb: ScriptBuilder, node: CallLikeExpression, optionsIn: VisitOptions): void {
    if (!ts.isCallExpression(node)) {
      /* istanbul ignore next */
      throw new Error('Something went wrong.');
    }

    const options = sb.pushValueOptions(optionsIn);
    const args = tsUtils.argumented.getArguments(node);
    // [...arr]
    _.reverse([...args]).forEach((arg) => {
      sb.visit(arg, options);
    });
    // [number, ...arr]
    sb.emitPushInt(node, args.length);
    // [arr]
    sb.emitOp(node, 'PACK');
    // []
    sb.emitHelper(node, options, sb.helpers.consoleLog);
  }
}
