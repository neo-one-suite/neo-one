import { tsUtils } from '@neo-one/ts-utils';
import _ from 'lodash';
import ts from 'typescript';

import { Types } from '../constants';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ArrayLiteralExpressionCompiler extends NodeCompiler<ts.ArrayLiteralExpression> {
  public readonly kind = ts.SyntaxKind.ArrayLiteralExpression;

  public visitNode(sb: ScriptBuilder, node: ts.ArrayLiteralExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    const elements = tsUtils.expression.getElements(node);
    if (elements.some((element) => ts.isSpreadElement(element))) {
      // [0]
      sb.emitPushInt(node, 0);
      // [arr]
      sb.emitOp(node, 'NEWARRAY');
      // [arr]
      elements.forEach((element) => {
        const handleArrayLike = () => {
          // [arrOut, val, arrOut]
          sb.emitOp(element, 'TUCK');
          // [val, arrOut, arrOut]
          sb.emitOp(element, 'SWAP');
          // [arrOut]
          sb.emitOp(element, 'APPEND');
        };

        const handleArray = (innerOptions: VisitOptions) => {
          // [arr, arrOut]
          sb.emitHelper(element, innerOptions, sb.helpers.unwrapArray);
          // [arrOut, arr]
          sb.emitOp(element, 'SWAP');
          sb.emitHelper(
            element,
            innerOptions,
            sb.helpers.arrReduce({
              each: handleArrayLike,
            }),
          );
        };

        const handleMapLike = (innerOption: VisitOptions) => {
          // [value, arrOut, key]
          sb.emitOp(element, 'ROT');
          // [key, value, arrOut]
          sb.emitOp(element, 'ROT');
          // [2, key, value, arrOut]
          sb.emitPushInt(element, 2);
          // [arr, arrOut]
          sb.emitOp(element, 'PACK');
          // [val, arrOut]
          sb.emitHelper(element, innerOption, sb.helpers.wrapArray);
          // [arrOut, val, arrOut]
          sb.emitOp(element, 'OVER');
          // [val, arrOut, arrOut]
          sb.emitOp(element, 'SWAP');
          // [arrOut]
          sb.emitOp(element, 'APPEND');
        };

        const handleMap = (innerOptions: VisitOptions) => {
          // [map, arrOut]
          sb.emitHelper(element, innerOptions, sb.helpers.unwrapMap);
          // [arrOut, map]
          sb.emitOp(element, 'SWAP');
          sb.emitHelper(
            element,
            innerOptions,
            sb.helpers.mapReduce({
              each: handleMapLike,
            }),
          );
        };

        const handleSetLike = () => {
          // [value, arrOut, key]
          sb.emitOp(element, 'ROT');
          // [arrOut, key]
          sb.emitOp(element, 'DROP');
          // [arrOut, key, arrOut]
          sb.emitOp(element, 'TUCK');
          // [key, arrOut, arrOut]
          sb.emitOp(element, 'SWAP');
          // [arrOut]
          sb.emitOp(element, 'APPEND');
        };

        const handleSet = (innerOptions: VisitOptions) => {
          // [map, arrOut]
          sb.emitHelper(element, innerOptions, sb.helpers.unwrapSet);
          // [arrOut, map]
          sb.emitOp(element, 'SWAP');
          sb.emitHelper(
            element,
            innerOptions,
            sb.helpers.mapReduce({
              each: handleSetLike,
            }),
          );
        };

        const handleArrayStorage = (innerOptions: VisitOptions) => {
          // [arrOut, val]
          sb.emitOp(element, 'SWAP');
          sb.emitHelper(
            element,
            innerOptions,
            sb.helpers.structuredStorageReduceVal({
              type: Types.ArrayStorage,
              each: handleArrayLike,
            }),
          );
        };

        const handleMapStorage = (innerOptions: VisitOptions) => {
          // [arrOut, val]
          sb.emitOp(element, 'SWAP');
          sb.emitHelper(
            element,
            innerOptions,
            sb.helpers.structuredStorageReduce({
              type: Types.MapStorage,
              each: handleMapLike,
            }),
          );
        };

        const handleSetStorage = (innerOptions: VisitOptions) => {
          // [arrOut, val]
          sb.emitOp(element, 'SWAP');
          sb.emitHelper(
            element,
            innerOptions,
            sb.helpers.structuredStorageReduce({
              type: Types.SetStorage,
              each: handleSetLike,
            }),
          );
        };

        const handleIterableIterator = (innerOptions: VisitOptions) => {
          // [arrOut, val]
          sb.emitOp(element, 'SWAP');
          sb.emitHelper(
            element,
            innerOptions,
            sb.helpers.iterableIteratorReduce({
              each: handleArrayLike,
            }),
          );
        };

        if (ts.isSpreadElement(element)) {
          const expr = tsUtils.expression.getExpression(element);
          // [iterable, arr]
          sb.visit(expr, options);
          // [arr]
          sb.emitHelper(
            element,
            options,
            sb.helpers.forIterableType({
              type: sb.context.analysis.getType(expr),
              array: handleArray,
              map: handleMap,
              set: handleSet,
              arrayStorage: handleArrayStorage,
              mapStorage: handleMapStorage,
              setStorage: handleSetStorage,
              iterableIterator: handleIterableIterator,
            }),
          );
        } else {
          // [arr, arr]
          sb.emitOp(node, 'DUP');
          // [val, arr, arr]
          sb.visit(element, options);
          // [arr]
          sb.emitOp(node, 'APPEND');
        }
      });
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapArray);
    } else {
      const reversedElements = _.reverse([...elements]);
      reversedElements.forEach((element) => {
        sb.visit(element, options);
      });
      // [length, ...vals]
      sb.emitPushInt(node, elements.length);
      // [arr]
      sb.emitOp(node, 'PACK');
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapArray);
    }

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
