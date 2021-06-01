import ts from 'typescript';
import { IterableIteratorSlots, IteratorResultSlots } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface IterableIteratorReduceHelperOptions {
  readonly each: (options: VisitOptions) => void;
}

// Input: [accum, val]
// Output: []
export class IterableIteratorReduceHelper extends Helper {
  private readonly each: (options: VisitOptions) => void;

  public constructor(options: IterableIteratorReduceHelperOptions) {
    super();
    this.each = options.each;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [val, accum]
    sb.emitOp(node, 'SWAP');
    // [map, accum]
    sb.emitHelper(node, options, sb.helpers.unwrapIterableIterator);
    // [number, map, accum]
    sb.emitPushInt(node, IterableIteratorSlots.next);
    // [callable, accum]
    sb.emitOp(node, 'PICKITEM');
    // [argsarr, callable, accum]
    sb.emitOp(node, 'NEWARRAY0');
    // [accum, argsarr, callable]
    sb.emitOp(node, 'ROT');
    sb.emitHelper(
      node,
      options,
      sb.helpers.forLoop({
        condition: () => {
          // [callable, accum, argsarr]
          sb.emitOp(node, 'ROT');
          // [argsarr, callable, accum]
          sb.emitOp(node, 'ROT');
          // [callable, argsarr, callable, accum]
          sb.emitOp(node, 'OVER');
          // [val, callable, accum]
          sb.emitHelper(node, options, sb.helpers.call);
          // [iteratorResult, callable, accum]
          sb.emitHelper(node, options, sb.helpers.unwrapIteratorResult);
          // [iteratorResult, iteratorResult, callable, accum]
          sb.emitOp(node, 'DUP');
          // [number, iteratorResult, iteratorResult, callable, accum]
          sb.emitPushInt(node, IteratorResultSlots.done);
          // [booleanVal, iteratorResult, callable, accum]
          sb.emitOp(node, 'PICKITEM');
          // [boolean, iteratorResult, callable, accum]
          sb.emitHelper(node, options, sb.helpers.unwrapBoolean);
          // [boolean, iteratorResult, callable, accum]
          sb.emitOp(node, 'NOT');
          // [3, boolean, iteratorResult, callable, accum]
          sb.emitPushInt(node, 3);
          // [accum, boolean, iteratorResult, callable]
          sb.emitOp(node, 'ROLL');
          // [boolean, accum, iteratorResult, callable]
          sb.emitOp(node, 'SWAP');
        },
        each: (innerOptions) => {
          // [iteratorResult, accum, callable]
          sb.emitOp(node, 'SWAP');
          // [number, iteratorResult, accum, callable]
          sb.emitPushInt(node, IteratorResultSlots.value);
          // [val, accum, callable]
          sb.emitOp(node, 'PICKITEM');
          // [argsarr, val, accum, callable]
          sb.emitOp(node, 'NEWARRAY0');
          // [val, argsarr, accum, callable]
          sb.emitOp(node, 'SWAP');
          // [accum, val, argsarr, callable]
          sb.emitOp(node, 'ROT');
          // [accum, argsarr, callable]
          this.each(sb.noPushValueOptions(innerOptions));
        },
        handleReturn: () => {
          // [argsarr, callable]
          sb.emitOp(node, 'DROP');
          // [callable]
          sb.emitOp(node, 'DROP');
          // []
          sb.emitOp(node, 'DROP');
        },
        cleanup: () => {
          // [accum, callable]
          sb.emitOp(node, 'NIP');
          // [accum]
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
