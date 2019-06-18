import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface RawIteratorForEachFuncBaseHelperOptions {
  readonly handleNext: (options: VisitOptions) => void;
  readonly hasFilter?: boolean;
}

// Input: [objectVal, iterator]
// Output: []
export class RawIteratorForEachFuncBaseHelper extends Helper {
  private readonly handleNext: (options: VisitOptions) => void;
  private readonly hasFilter: boolean;

  public constructor({ handleNext, hasFilter = false }: RawIteratorForEachFuncBaseHelperOptions) {
    super();
    this.handleNext = handleNext;
    this.hasFilter = hasFilter;
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
        each: (innerOptionsIn) => {
          const innerOptions = sb.pushValueOptions(innerOptionsIn);
          // [iterator, iterator, callable]
          sb.emitOp(node, 'DUP');

          const handleCall = () => {
            // [2, argsarr, iterator, callable]
            sb.emitPushInt(node, 2);
            // [callable, argsarr, iterator, callable]
            sb.emitOp(node, 'PICK');
            // [iterator, callable]
            sb.emitHelper(node, sb.noPushValueOptions(innerOptions), sb.helpers.call);
          };

          if (this.hasFilter) {
            sb.emitHelper(
              node,
              innerOptions,
              sb.helpers.if({
                condition: () => {
                  // [boolean, argsarr, iterator, callable]
                  this.handleNext(innerOptions);
                },
                whenTrue: () => {
                  // [iterator, callable]
                  handleCall();
                },
                whenFalse: () => {
                  // [iterator, callable]
                  sb.emitOp(node, 'DROP');
                },
              }),
            );
          } else {
            // [argsarr, iterator, callable]
            this.handleNext(innerOptions);
            // [iterator, callable]
            handleCall();
          }
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
