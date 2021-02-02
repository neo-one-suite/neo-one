import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawEnumeratorFindHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [enumerator]
// Output: [val]
export class RawEnumeratorFindHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: RawEnumeratorFindHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [arr]
    sb.emitHelper(
      node,
      options,
      sb.helpers.rawEnumeratorFilter({
        each: this.each,
      }),
    );
    // [arr, arr]
    sb.emitOp(node, 'DUP');
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [size, arr]
          sb.emitOp(node, 'SIZE');
          // [0, size, arr]
          sb.emitPushInt(node, 0);
          // [size == 0, arr]
          sb.emitOp(node, 'NUMEQUAL');
        },
        whenTrue: () => {
          // []
          sb.emitOp(node, 'DROP');
          // [val]
          sb.emitHelper(node, options, sb.helpers.wrapUndefined);
        },
        whenFalse: () => {
          // [0, arr]
          sb.emitPushInt(node, 0);
          // [val]
          sb.emitOp(node, 'PICKITEM');
        },
      }),
    );
  }
}
