import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawIteratorEveryBaseHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [iterator]
// Output: [boolean]
export class RawIteratorEveryBaseHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: RawIteratorEveryBaseHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [result, iterator]
    sb.emitPushBoolean(node, true);
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
          // [iterator, result, result, iterator]
          sb.emitOp(node, 'SWAP');
          // [boolean, result, result, iterator]
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
      }),
    );
    // [result]
    sb.emitOp(node, 'NIP');

    if (!optionsIn.pushValue) {
      // []
      sb.emitOp(node, 'DROP');
    }
  }
}
