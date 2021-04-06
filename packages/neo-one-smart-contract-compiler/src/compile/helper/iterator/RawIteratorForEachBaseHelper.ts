import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawIteratorForEachBaseHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [iterator]
// Output: []
export class RawIteratorForEachBaseHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: RawIteratorForEachBaseHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [iterator, iterator]
          sb.emitOp(node, 'DUP');
          // [boolean, iterator]
          sb.emitSysCall(node, 'System.Iterator.Next');
        },
        each: (innerOptions) => {
          // [iterator, iterator]
          sb.emitOp(node, 'DUP');
          // [iterator]
          this.each(sb.noPushValueOptions(innerOptions));
        },
        cleanup: () => {
          // []
          sb.emitOp(node, 'DROP');
        },
      }),
    );
  }
}
