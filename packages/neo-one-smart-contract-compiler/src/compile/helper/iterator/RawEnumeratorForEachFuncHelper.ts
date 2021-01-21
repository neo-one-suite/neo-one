import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawEnumeratorForEachFuncHelperOptions {
  readonly deserializeKey?: boolean;
}

// Input: [objectVal, enumerator]
// Output: []
export class RawEnumeratorForEachFuncHelper extends Helper {
  private readonly deserializeKey: boolean;

  public constructor(options: RawEnumeratorForEachFuncHelperOptions) {
    super();
    this.deserializeKey = options.deserializeKey ?? false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [callable, enumerator]
    sb.emitHelper(node, options, sb.helpers.getCallable({}));
    // [enumerator, callable]
    sb.emitOp(node, 'SWAP');
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [enumerator, enumerator, callable]
          sb.emitOp(node, 'DUP');
          // [boolean, enumerator, callable]
          sb.emitSysCall(node, 'Neo.Enumerator.Next');
        },
        each: (innerOptions) => {
          // [enumerator, enumerator, callable]
          sb.emitOp(node, 'DUP');
          // [key, enumerator, callable]
          sb.emitSysCall(node, 'Neo.Enumerator.Value');
          if (this.deserializeKey) {
            // [key, enumerator, callable]
            sb.emitSysCall(node, 'Neo.Runtime.Deserialize');
          }
          // [1, value, enumerator, callable]
          sb.emitPushInt(node, 1);
          // [argsarr, enumerator, callable]
          sb.emitOp(node, 'PACK');
          // [2, argsarr, enumerator, callable]
          sb.emitPushInt(node, 2);
          // [callable, argsarr, enumerator, callable]
          sb.emitOp(node, 'PICK');
          // [enumerator, callable]
          sb.emitHelper(node, sb.noPushValueOptions(innerOptions), sb.helpers.call);
        },
        cleanup: () => {
          // [callable]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
        },
      }),
    );
  }
}
