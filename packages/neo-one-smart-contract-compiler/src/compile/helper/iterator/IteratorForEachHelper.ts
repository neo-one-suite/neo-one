import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface IteratorForEachHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [objectVal]
// Output: []
export class IteratorForEachHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: IteratorForEachHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [objectVal, objectVal]
    sb.emitOp(node, 'DUP');
    // [string, objectVal, objectVal]
    sb.emitPushString(node, 'next');
    // [objectVal, objectVal]
    sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
    // [objectVal]
    sb.emitHelper(node, options, sb.helpers.getCallable({ bindThis: true }));
    // [0, objectVal]
    sb.emitPushInt(node, 0);
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [argsarr, objectVal]
          sb.emitOp(node, 'NEWARRAY');
          // [objectVal, argsarr, objectVal]
          sb.emitOp(node, 'OVER');
          // [val, objectVal]
          sb.emitHelper(node, options, sb.helpers.call);
          // [val, val, objectVal]
          sb.emitOp(node, 'DUP');
          // ['done', val, val, objectVal]
          sb.emitPushString(node, 'done');
          // [booleanVal, val, objectVal]
          sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
          // [boolean, val, objectVal]
          sb.emitHelper(node, options, sb.helpers.unwrapBoolean);
          // [boolean, val, objectVal]
          sb.emitOp(node, 'NOT');
        },
        each: (innerOptions) => {
          // ['value', val, objectVal]
          sb.emitPushString(node, 'value');
          // [val, objectVal]
          sb.emitHelper(node, sb.pushValueOptions(innerOptions), sb.helpers.getPropertyObjectProperty);
          // [0, objectVal]
          sb.emitPushInt(node, 0);
          // [val, 0, objectVal]
          sb.emitOp(node, 'SWAP');
          // [0, objectVal]
          this.each(sb.noPushValueOptions(innerOptions));
        },
      }),
    );
    // [objectVal]
    sb.emitOp(node, 'DROP');
    // []
    sb.emitOp(node, 'DROP');
  }
}
