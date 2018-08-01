import ts from 'typescript';

import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { InternalFunctionProperties } from '../function';
import { Helper } from '../Helper';
import { AddConstructorObjectHelper } from './AddConstructorObjectHelper';

// Input: [objectPrototypeVal, globalObjectVal]
// Output: [objectPrototypeVal, globalObjectVal]
export class AddArrayObjectHelper extends AddConstructorObjectHelper {
  protected readonly name = 'Array';

  protected addPrototypeProperties(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    this.addMap(sb, node, options);
    this.addFilter(sb, node, options);
    this.addReduce(sb, node, options);
  }

  protected addConstructorProperties(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [objectVal, objectVal, globalObjectVal]
    sb.emitOp(node, 'DUP');
    // ['construct', objectVal, objectVal, globalObjectVal]
    sb.emitPushString(node, InternalFunctionProperties.Construct);
    // [func, 'construct', objectVal, objectVal, globalObjectVal]
    sb.emitHelper(
      node,
      options,
      sb.helpers.createConstructArray({
        withoutScope: true,
        body: () => {
          // [argsarray, argsarray]
          sb.emitOp(node, 'DUP');
          // [size, argsarray]
          sb.emitOp(node, 'ARRAYSIZE');
          sb.emitHelper(
            node,
            options,
            sb.helpers.case(
              [
                {
                  condition: () => {
                    // [size, size, argsarray]
                    sb.emitOp(node, 'DUP');
                    // [0, size, size, argsarray]
                    sb.emitPushInt(node, 0);
                    // [size === 0, size, argsarray]
                    sb.emitOp(node, 'EQUAL');
                  },
                  whenTrue: () => {
                    // [argsarray]
                    sb.emitOp(node, 'DROP');
                    // []
                    sb.emitOp(node, 'DROP');
                    // [length]
                    sb.emitPushInt(node, 0);
                    // [0, length]
                    sb.emitPushInt(node, 0);
                    // [array, length]
                    sb.emitOp(node, 'NEWARRAY');
                  },
                },
                {
                  condition: () => {
                    // [size, size, argsarray]
                    sb.emitOp(node, 'DUP');
                    // [1, size, size, argsarray]
                    sb.emitPushInt(node, 1);
                    // [size === 1, size, argsarray]
                    sb.emitOp(node, 'EQUAL');
                  },
                  whenTrue: () => {
                    // [argsarray]
                    sb.emitOp(node, 'DROP');
                    // [0, argsarray]
                    sb.emitPushInt(node, 0);
                    // [lengthVal]
                    sb.emitOp(node, 'PICKITEM');
                    // [length]
                    sb.emitHelper(node, options, sb.helpers.getNumber);
                    // [length, length]
                    sb.emitOp(node, 'DUP');
                    // [0, length, length]
                    sb.emitPushInt(node, 0);
                    // [arr, length, length]
                    sb.emitOp(node, 'NEWARRAY');
                    // [arr, length, arr, length]
                    sb.emitOp(node, 'TUCK');
                    // [length, arr, arr, length]
                    sb.emitOp(node, 'SWAP');
                    // [array, length]
                    sb.emitHelper(node, options, sb.helpers.extendArray);
                  },
                },
              ],
              () => {
                // [array, length]
                sb.emitOp(node, 'SWAP');
              },
            ),
          );
          // [objectVal, arr, length]
          sb.scope.getThis(sb, node, options);
          // [objectVal, objectVal, arr, length]
          sb.emitOp(node, 'DUP');
          // [arr, objectVal, objectVal, length]
          sb.emitOp(node, 'ROT');
          // [objectVal, length]
          sb.emitHelper(node, options, sb.helpers.setArrayValue);
          // ['length', objectVal, length]
          sb.emitPushString(node, 'length');
          // [length, 'length', objectVal]
          sb.emitOp(node, 'ROT');
          // [lengthVal, 'length', objectVal]
          sb.emitHelper(node, options, sb.helpers.createNumber);
          // []
          sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
        },
      }),
    );
    // [objectVal, globalObjectVal]
    sb.emitHelper(node, options, sb.helpers.setInternalObjectProperty);
  }

  private addMap(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    this.addMapLike(sb, node, options, 'map', sb.helpers.arrMap);
  }

  private addFilter(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    this.addMapLike(sb, node, options, 'filter', sb.helpers.arrFilter);
  }

  private addReduce(sb: ScriptBuilder, node: ts.Node, outerOptions: VisitOptions): void {
    this.addMethod(sb, node, outerOptions, 'reduce', (options) => {
      const func = sb.scope.addUnique();
      const accum = sb.scope.addUnique();
      // [argsarr, argsarr]
      sb.emitOp(node, 'DUP');
      // [0, argsarr, argsarr]
      sb.emitPushInt(node, 0);
      // [fObjectVal, argsarr]
      sb.emitOp(node, 'PICKITEM');
      // [argsarr]
      sb.scope.set(sb, node, options, func);
      // [argsarr, argsarr]
      sb.emitOp(node, 'DUP');
      // [size, argsarr]
      sb.emitOp(node, 'ARRAYSIZE');
      // [val]
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [2, size, argsarr]
            sb.emitPushInt(node, 2);
            // [size === 2, argsarr]
            sb.emitOp(node, 'NUMEQUAL');
          },
          whenTrue: () => {
            // [1, argsarr]
            sb.emitPushInt(node, 1);
            // [val]
            sb.emitOp(node, 'PICKITEM');
          },
          whenFalse: () => {
            // []
            sb.emitOp(node, 'DROP');
            // [val]
            sb.emitHelper(node, options, sb.helpers.createUndefined);
          },
        }),
      );
      // []
      sb.scope.set(sb, node, options, accum);
      // [arrayObjectVal]
      sb.scope.getThis(sb, node, options);
      // [arr]
      sb.emitHelper(node, options, sb.helpers.unwrapArray);
      // [arr]
      sb.emitHelper(
        node,
        options,
        sb.helpers.arrForEach({
          each: () => {
            // [accum, val, index]
            sb.scope.get(sb, node, options, accum);
            // [index, accum, val]
            sb.emitOp(node, 'ROT');
            // [indexVal, accum, val]
            sb.emitHelper(node, options, sb.helpers.createNumber);
            // [val, indexVal, accum]
            sb.emitOp(node, 'ROT');
            // [accum, val, indexVal]
            sb.emitOp(node, 'ROT');
            // [3, accum, val, indexVal]
            sb.emitPushInt(node, 3);
            // [argsarr]
            sb.emitOp(node, 'PACK');
            // [fObjectVal, argsarr]
            sb.scope.get(sb, node, options, func);
            // [val]
            sb.emitHelper(node, options, sb.helpers.invokeCall());
            // []
            sb.scope.set(sb, node, options, accum);
          },
          withIndex: true,
        }),
      );
      // [val]
      sb.scope.get(sb, node, options, accum);
    });
  }

  private addMapLike(
    sb: ScriptBuilder,
    node: ts.Node,
    outerOptions: VisitOptions,
    name: string,
    helper: ((options: { readonly map: () => void; readonly withIndex: boolean }) => Helper),
  ): void {
    this.addMethod(sb, node, outerOptions, name, (options) => {
      const func = sb.scope.addUnique();
      // [0, argsarr]
      sb.emitPushInt(node, 0);
      // [fObjectVal]
      sb.emitOp(node, 'PICKITEM');
      // []
      sb.scope.set(sb, node, options, func);
      // [arrayObjectVal]
      sb.scope.getThis(sb, node, options);
      // [arr]
      sb.emitHelper(node, options, sb.helpers.unwrapArray);
      // [arr]
      sb.emitHelper(
        node,
        options,
        helper({
          map: () => {
            // [index, val]
            sb.emitOp(node, 'SWAP');
            // [indexVal, val]
            sb.emitHelper(node, options, sb.helpers.createNumber);
            // [val, indexVal]
            sb.emitOp(node, 'SWAP');
            // [2, val, indexVal]
            sb.emitPushInt(node, 2);
            // [argsarr]
            sb.emitOp(node, 'PACK');
            // [fObjectVal, argsarr]
            sb.scope.get(sb, node, options, func);
            // [val]
            sb.emitHelper(node, options, sb.helpers.invokeCall());
          },
          withIndex: true,
        }),
      );
      // [arrayObjectVal]
      sb.emitHelper(node, options, sb.helpers.wrapArray);
    });
  }
}
