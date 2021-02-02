import ts from 'typescript';
import { IterableIteratorSlots } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface CreateIterableIteratorBaseHelperOptions {
  readonly handleNext: (options: VisitOptions) => void;
  readonly hasFilter?: boolean;
}

// Input: [iterator]
// Output: [val]
export class CreateIterableIteratorBaseHelper extends Helper {
  private readonly handleNext: (options: VisitOptions) => void;
  private readonly hasFilter: boolean;

  public constructor({ handleNext, hasFilter = false }: CreateIterableIteratorBaseHelperOptions) {
    super();
    this.handleNext = handleNext;
    this.hasFilter = hasFilter;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    // [map, iterator]
    sb.emitOp(node, 'NEWMAP');
    // [map, iterator, map]
    sb.emitOp(node, 'TUCK');
    // [number, map, iterator, map]
    sb.emitPushInt(node, IterableIteratorSlots.internalIterator);
    // [iterator, number, map, map]
    sb.emitOp(node, 'ROT');
    // [map]
    sb.emitOp(node, 'SETITEM');
    // [map, map]
    sb.emitOp(node, 'DUP');
    // [val, map]
    sb.emitHelper(node, options, sb.helpers.wrapIterableIterator);
    // [val, map, val]
    sb.emitOp(node, 'TUCK');
    // [map, val, map, val]
    sb.emitOp(node, 'OVER');
    // [val, map, val, map, val]
    sb.emitOp(node, 'OVER');
    // [farr, val, map, val, map, val]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createFunctionArray({
        body: (innerOptionsIn) => {
          const innerOptions = sb.pushValueOptions(innerOptionsIn);
          // []
          sb.emitOp(node, 'DROP');
          // [val]
          sb.scope.getThis(sb, node, innerOptions);
          // []
          sb.emitHelper(node, innerOptions, sb.helpers.return);
        },
      }),
    );
    // [farr, map, val, map, val]
    sb.emitHelper(node, options, sb.helpers.bindFunctionThis({ overwrite: true }));
    // [number, farr, map, val, map, val]
    sb.emitPushInt(node, IterableIteratorSlots.iterator);
    // [farr, number, map, val, map, val]
    sb.emitOp(node, 'SWAP');
    // [val, map, val]
    sb.emitOp(node, 'SETITEM');
    // [farr, val, map, val]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createFunctionArray({
        body: (innerOptionsIn) => {
          const innerOptions = sb.pushValueOptions(innerOptionsIn);
          // []
          sb.emitOp(node, 'DROP');
          // [val]
          sb.scope.getThis(sb, node, innerOptions);
          // [map]
          sb.emitHelper(node, innerOptions, sb.helpers.unwrapIterableIterator);
          // [number, map]
          sb.emitPushInt(node, IterableIteratorSlots.internalIterator);
          // [iterator]
          sb.emitOp(node, 'PICKITEM');
          if (this.hasFilter) {
            sb.emitHelper(
              node,
              innerOptions,
              sb.helpers.forLoop({
                condition: () => {
                  sb.emitHelper(
                    node,
                    innerOptions,
                    sb.helpers.if({
                      condition: () => {
                        // [iterator, iterator]
                        sb.emitOp(node, 'DUP');
                        // [boolean, iterator]
                        sb.emitSysCall(node, 'System.Enumerator.Next');
                      },
                      whenTrue: () => {
                        sb.emitHelper(
                          node,
                          innerOptions,
                          sb.helpers.if({
                            condition: () => {
                              // [iterator, iterator]
                              sb.emitOp(node, 'DUP');
                              // [boolean, valueVal, iterator]
                              this.handleNext(innerOptions);
                            },
                            whenTrue: () => {
                              // [valueVal]
                              sb.emitOp(node, 'NIP');
                              // [boolean, valueVal]
                              sb.emitPushBoolean(node, false);
                              // [doneVal, valueVal]
                              sb.emitHelper(node, innerOptions, sb.helpers.wrapBoolean);
                              // [boolean, doneVal, valueVal]
                              sb.emitPushBoolean(node, false);
                            },
                            whenFalse: () => {
                              // [iterator]
                              sb.emitOp(node, 'DROP');
                              // [boolean, iterator]
                              sb.emitPushBoolean(node, true);
                            },
                          }),
                        );
                      },
                      whenFalse: () => {
                        // []
                        sb.emitOp(node, 'DROP');
                        // [valueVal]
                        sb.emitHelper(node, innerOptions, sb.helpers.wrapUndefined);
                        // [boolean, valueVal]
                        sb.emitPushBoolean(node, true);
                        // [doneVal, valueVal]
                        sb.emitHelper(node, innerOptions, sb.helpers.wrapBoolean);
                        // [boolean, doneVal, valueVal]
                        sb.emitPushBoolean(node, false);
                      },
                    }),
                  );
                },
                each: () => {
                  // do nothing
                },
                cleanup: () => {
                  // do nothing
                },
              }),
            );
          } else {
            sb.emitHelper(
              node,
              innerOptions,
              sb.helpers.if({
                condition: () => {
                  // [iterator, iterator]
                  sb.emitOp(node, 'DUP');
                  // [boolean, iterator]
                  sb.emitSysCall(node, 'System.Enumerator.Next');
                },
                whenTrue: () => {
                  // [valueVal]
                  this.handleNext(innerOptions);
                  // [boolean, valueVal]
                  sb.emitPushBoolean(node, false);
                  // [doneVal, valueVal]
                  sb.emitHelper(node, innerOptions, sb.helpers.wrapBoolean);
                },
                whenFalse: () => {
                  // []
                  sb.emitOp(node, 'DROP');
                  // [valueVal]
                  sb.emitHelper(node, innerOptions, sb.helpers.wrapUndefined);
                  // [boolean, valueVal]
                  sb.emitPushBoolean(node, true);
                  // [doneVal, valueVal]
                  sb.emitHelper(node, innerOptions, sb.helpers.wrapBoolean);
                },
              }),
            );
          }
          // [val]
          sb.emitHelper(node, innerOptions, sb.helpers.createIteratorResult);
          // []
          sb.emitHelper(node, innerOptions, sb.helpers.return);
        },
      }),
    );
    // [farr, map, val]
    sb.emitHelper(node, options, sb.helpers.bindFunctionThis({ overwrite: true }));
    // [number, farr, map, val]
    sb.emitPushInt(node, IterableIteratorSlots.next);
    // [farr, number, map, val]
    sb.emitOp(node, 'SWAP');
    // [val]
    sb.emitOp(node, 'SETITEM');
  }
}
