import { tsUtils } from '@neo-one/ts-utils';
import _ from 'lodash';
import ts from 'typescript';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinCall } from '../../BuiltinCall';

// tslint:disable-next-line export-name
export class CreateOrMigrateCall extends BuiltinCall {
  public constructor(private readonly syscall: 'Neo.Contract.Create' | 'Neo.Contract.Migrate') {
    super();
  }
  public emitCall(sb: ScriptBuilder, node: ts.CallExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const args = _.reverse([...tsUtils.argumented.getArguments(node)]);
    if (args.length !== 9) {
      /* istanbul ignore next */
      return;
    }

    sb.visit(args[0], options);
    sb.emitHelper(args[0], options, sb.helpers.unwrapString);
    sb.visit(args[1], options);
    sb.emitHelper(args[1], options, sb.helpers.unwrapString);
    sb.visit(args[2], options);
    sb.emitHelper(args[2], options, sb.helpers.unwrapString);
    sb.visit(args[3], options);
    sb.emitHelper(args[3], options, sb.helpers.unwrapString);
    sb.visit(args[4], options);
    sb.emitHelper(args[4], options, sb.helpers.unwrapString);
    sb.visit(args[5], options);
    sb.emitHelper(args[5], options, sb.helpers.unwrapNumber);
    sb.visit(args[6], options);
    sb.emitHelper(args[6], options, sb.helpers.unwrapNumber);
    sb.visit(args[7], options);
    sb.emitHelper(args[7], options, sb.helpers.unwrapBuffer);
    sb.visit(args[8], options);
    sb.emitHelper(args[8], options, sb.helpers.unwrapBuffer);
    sb.emitSysCall(node, this.syscall);
    if (optionsIn.pushValue) {
      // [contractVal]
      sb.emitHelper(node, options, sb.helpers.wrapContract);
    } else {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
