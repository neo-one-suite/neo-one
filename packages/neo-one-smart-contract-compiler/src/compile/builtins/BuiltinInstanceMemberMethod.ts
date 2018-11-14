import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';
import { BuiltinInstanceMemberCall } from './BuiltinInstanceMemberCall';
import { CallMemberLikeExpression } from './types';

// tslint:disable-next-line export-name
export class BuiltinInstanceMemberMethod extends BuiltinInstanceMemberCall {
  public constructor(private readonly method: ts.MethodDeclaration) {
    super();
  }

  public canCall(): boolean {
    return true;
  }

  public emitCall(
    sb: ScriptBuilder,
    _func: CallMemberLikeExpression,
    node: ts.CallExpression,
    optionsIn: VisitOptions,
    visited: boolean,
  ): void {
    const options = sb.pushValueOptions(optionsIn);

    if (visited) {
      // []
      sb.emitOp(node, 'DROP');
    }

    // [argsarr]
    sb.emitHelper(node, options, sb.helpers.args);
    sb.withScope(this.method, optionsIn, (innerOptions) => {
      sb.emitHelper(
        this.method,
        sb.pushValueOptions(innerOptions),
        sb.helpers.parameters({
          params: tsUtils.parametered.getParameters(this.method),
        }),
      );
      // [val]
      sb.emitHelper(node, innerOptions, sb.helpers.invokeSmartContractMethod({ method: this.method }));
    });
  }
}
