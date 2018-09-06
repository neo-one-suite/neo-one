import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawIteratorForEachFuncBaseHelperOptions {
  readonly handleNext: (options: VisitOptions) => void;
}

// Input: [objectVal, iterator]
// Output: []
export class RawIteratorForEachFuncBaseHelper extends Helper {
  private readonly handleNext: (options: VisitOptions) => void;

  public constructor(options: RawIteratorForEachFuncBaseHelperOptions) {
    super();
    this.handleNext = options.handleNext;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [callable, iterator]
    sb.emitHelper(node, options, sb.helpers.getCallable({}));
    // [iterator, callable]
    sb.emitOp(node, 'SWAP');
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [iterator, iterator, callable]
          sb.emitOp(node, 'DUP');
          // [boolean, iterator, callable]
          sb.emitSysCall(node, 'Neo.Enumerator.Next');
        },
        each: (innerOptions) => {
          // [iterator, iterator, callable]
          sb.emitOp(node, 'DUP');
          // [argsarr, iterator, callable]
          this.handleNext(innerOptions);
          // [2, argsarr, iterator, callable]
          sb.emitPushInt(node, 2);
          // [callable, argsarr, iterator, callable]
          sb.emitOp(node, 'PICK');
          // [iterator, callable]
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
