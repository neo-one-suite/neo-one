import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawIteratorForEachHelperFuncOptions {
  readonly deserializeKey?: boolean;
}

// Input: [objectVal, iterator]
// Output: []
export class RawIteratorForEachFuncHelper extends Helper {
  private readonly deserializeKey: boolean;

  public constructor(options: RawIteratorForEachHelperFuncOptions) {
    super();
    this.deserializeKey = options.deserializeKey || false;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    sb.emitHelper(
      node,
      options,
      sb.helpers.rawIteratorForEachFuncBase({
        handleNext: () => {
          // [key, iterator, callable]
          sb.emitSysCall(node, 'Neo.Iterator.Key');
          if (this.deserializeKey) {
            // [key, iterator, callable]
            sb.emitSysCall(node, 'Neo.Runtime.Deserialize');
          }
          // [iterator, key, iterator, callable]
          sb.emitOp(node, 'OVER');
          // [value, key, iterator, callable]
          sb.emitSysCall(node, 'Neo.Enumerator.Value');
          // [2, value, key, iterator, callable]
          sb.emitPushInt(node, 2);
          // [argsarr, iterator, callable]
          sb.emitOp(node, 'PACK');
        },
      }),
    );
  }
}
