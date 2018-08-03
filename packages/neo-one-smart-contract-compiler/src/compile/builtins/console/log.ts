import { tsUtils } from '@neo-one/ts-utils';
import _ from 'lodash';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInCallable } from '../types';

// tslint:disable-next-line export-name
export class ConsoleLog extends BuiltInCallable {
  public emitCall(sb: ScriptBuilder, node: ts.CallExpression, optionsIn: VisitOptions): void {
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
