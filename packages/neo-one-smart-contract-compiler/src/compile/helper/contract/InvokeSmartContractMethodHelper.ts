import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

type MethodType =
  | ts.MethodDeclaration
  | ts.GetAccessorDeclaration
  | ts.SetAccessorDeclaration
  | ts.ConstructorDeclaration;

export interface InvokeSmartContractMethodHelperOptions {
  readonly method: MethodType;
}

// Input: []
// Output: []
export class InvokeSmartContractMethodHelper extends Helper {
  private readonly method: MethodType;

  public constructor({ method }: InvokeSmartContractMethodHelperOptions) {
    super();
    this.method = method;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    sb.withProgramCounter((finallyPC) => {
      sb.withProgramCounter((catchPC) => {
        const rootOptions = sb.finallyPCOptions(sb.catchPCOptions(options, catchPC.getLast()), finallyPC.getLast());
        sb.visit(tsUtils.body.getBodyOrThrow(this.method), rootOptions);
        sb.emitHelper(this.method, rootOptions, sb.helpers.wrapUndefined);
        sb.emitHelper(this.method, rootOptions, sb.helpers.return);
      });
      // Error thrown, drop the THROW_COMPLETION and rehandle it for trace
      // [error]
      sb.emitOp(node, 'DROP');
      // We don't pass the finallyPC in here because we actually want to break out of this call
      // []
      sb.emitHelper(node, options, sb.helpers.throwCompletion);
    });
    // Drop the FINALLY_COMPLETION
    // [normal, val]
    sb.emitOp(node, 'DROP');
    // [val]
    sb.emitOp(node, 'DROP');

    if (!optionsIn.pushValue) {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
