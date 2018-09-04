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

    sb.withProgramCounter((pc) => {
      const rootOptions = sb.rootPCOptions(options, pc.getLast());
      sb.visit(tsUtils.body.getBodyOrThrow(this.method), rootOptions);
      sb.emitHelper(node, rootOptions, sb.helpers.wrapUndefined);
      sb.emitHelper(node, rootOptions, sb.helpers.return);
    });

    if (!optionsIn.pushValue) {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
