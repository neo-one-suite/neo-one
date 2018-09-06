import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawIteratorSomeBaseHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [iterator]
// Output: [boolean]
export class RawIteratorSomeBaseHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: RawIteratorSomeBaseHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [result, iterator]
    sb.emitPushBoolean(node, false);
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [iterator, result]
          sb.emitOp(node, 'SWAP');
          // [iterator, result, iterator]
          sb.emitOp(node, 'TUCK');
          // [result, iterator, result, iterator]
          sb.emitOp(node, 'OVER');
          // [!result, iterator, result, iterator]
          sb.emitOp(node, 'NOT');
          // [iterator, !result, result, iterator]
          sb.emitOp(node, 'SWAP');
          // [boolean, !result, result, iterator]
          sb.emitSysCall(node, 'Neo.Enumerator.Next');
          // [boolean, result, iterator]
          sb.emitOp(node, 'BOOLAND');
        },
        each: (innerOptions) => {
          // [iterator]
          sb.emitOp(node, 'DROP');
          // [iterator, iterator]
          sb.emitOp(node, 'DUP');
          // [result, iterator]
          this.each(sb.pushValueOptions(innerOptions));
        },
        handleReturn: () => {
          // [iterator]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
        },
        cleanup: () => {
          // [result]
          sb.emitOp(node, 'NIP');

          if (!optionsIn.pushValue) {
            // []
            sb.emitOp(node, 'DROP');
          }
        },
      }),
    );
  }
}
