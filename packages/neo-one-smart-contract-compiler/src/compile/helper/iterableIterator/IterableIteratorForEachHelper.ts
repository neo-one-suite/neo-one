import ts from 'typescript';
import { IterableIteratorSlots, IteratorResultSlots } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface IterableIteratorForEachHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [val]
// Output: []
export class IterableIteratorForEachHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: IterableIteratorForEachHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [map]
    sb.emitHelper(node, options, sb.helpers.unwrapIterableIterator);
    // [number, map]
    sb.emitPushInt(node, IterableIteratorSlots.next);
    // [callable]
    sb.emitOp(node, 'PICKITEM');
    // [argsarr, callable]
    sb.emitOp(node, 'NEWARRAY0');
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [callable, argsarr, callable]
          sb.emitOp(node, 'OVER');
          // [val, callable]
          sb.emitHelper(node, options, sb.helpers.call);
          // [iteratorResult, callable]
          sb.emitHelper(node, options, sb.helpers.unwrapIteratorResult);
          // [iteratorResult, iteratorResult, callable]
          sb.emitOp(node, 'DUP');
          // [number, iteratorResult, iteratorResult, callable]
          sb.emitPushInt(node, IteratorResultSlots.done);
          // [booleanVal, iteratorResult, callable]
          sb.emitOp(node, 'PICKITEM');
          // [boolean, iteratorResult, callable]
          sb.emitHelper(node, options, sb.helpers.unwrapBoolean);
          // [boolean, iteratorResult, callable]
          sb.emitOp(node, 'NOT');
        },
        each: (innerOptions) => {
          // [number, iteratorResult, callable]
          sb.emitPushInt(node, IteratorResultSlots.value);
          // [val, callable]
          sb.emitOp(node, 'PICKITEM');
          // [argsarr, val, callable]
          sb.emitOp(node, 'NEWARRAY0');
          // [val, argsarr, callable]
          sb.emitOp(node, 'SWAP');
          // [argsarr, callable]
          this.each(sb.noPushValueOptions(innerOptions));
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
