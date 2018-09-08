import { tsUtils } from '@neo-one/ts-utils';
import _ from 'lodash';
import ts from 'typescript';
import { DiagnosticCode } from '../../../DiagnosticCode';
import { DiagnosticMessage } from '../../../DiagnosticMessage';
import { Types } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { getHasBuiltins } from '../types';

// Input: []
// Output: [argsArray]
export class ArgumentsHelper extends Helper<ts.CallExpression | ts.NewExpression | ts.ArrayLiteralExpression> {
  public emit(
    sb: ScriptBuilder,
    node: ts.CallExpression | ts.NewExpression | ts.ArrayLiteralExpression,
    optionsIn: VisitOptions,
  ): void {
    const options = sb.pushValueOptions(optionsIn);
    const args = ts.isArrayLiteralExpression(node)
      ? tsUtils.expression.getElements(node)
      : tsUtils.argumented.getArgumentsArray(node);
    if (!ts.isArrayLiteralExpression(node) && args.length > 0) {
      const signatureTypes = sb.context.analysis.extractSignaturesForCall(node, { error: true });

      if (signatureTypes !== undefined) {
        args.forEach((arg, idx) => {
          const argType = sb.context.analysis.getType(arg);
          if (argType !== undefined) {
            const mismatch = signatureTypes.some(({ paramDecls, paramTypes }) => {
              const paramDecl = paramDecls[Math.min(idx, paramDecls.length - 1)];
              let paramTypeIn = paramTypes.get(paramDecl);
              if (paramTypeIn !== undefined && tsUtils.parameter.isRestParameter(paramDecl)) {
                paramTypeIn = tsUtils.type_.getArrayType(paramTypeIn);
              }
              const paramType = paramTypeIn;
              const hasBuiltins = getHasBuiltins(sb.context, arg, argType);

              return (
                paramType === undefined ||
                hasBuiltins.some((hasBuiltin) => !hasBuiltin(sb.context, paramDecl, paramType))
              );
            });

            if (mismatch) {
              sb.context.reportError(
                arg,
                DiagnosticCode.InvalidBuiltinUsage,
                DiagnosticMessage.InvalidBuiltinCallArgument,
              );
            }
          }
        });
      }
    }

    if (args.some((arg) => ts.isSpreadElement(arg))) {
      // [0]
      sb.emitPushInt(node, 0);
      // [arr]
      sb.emitOp(node, 'NEWARRAY');
      // [arr]
      args.forEach((arg) => {
        const handleArrayLike = () => {
          // [arrOut, val, arrOut]
          sb.emitOp(arg, 'TUCK');
          // [val, arrOut, arrOut]
          sb.emitOp(arg, 'SWAP');
          // [arrOut]
          sb.emitOp(arg, 'APPEND');
        };

        const handleArray = (innerOptions: VisitOptions) => {
          // [arr, arrOut]
          sb.emitHelper(arg, innerOptions, sb.helpers.unwrapArray);
          // [arrOut, arr]
          sb.emitOp(arg, 'SWAP');
          sb.emitHelper(
            arg,
            innerOptions,
            sb.helpers.arrReduce({
              each: handleArrayLike,
            }),
          );
        };

        const handleMapLike = (innerOption: VisitOptions) => {
          // [value, arrOut, key]
          sb.emitOp(arg, 'ROT');
          // [key, value, arrOut]
          sb.emitOp(arg, 'ROT');
          // [2, key, value, arrOut]
          sb.emitPushInt(arg, 2);
          // [arr, arrOut]
          sb.emitOp(arg, 'PACK');
          // [val, arrOut]
          sb.emitHelper(arg, innerOption, sb.helpers.wrapArray);
          // [arrOut, val, arrOut]
          sb.emitOp(arg, 'OVER');
          // [val, arrOut, arrOut]
          sb.emitOp(arg, 'SWAP');
          // [arrOut]
          sb.emitOp(arg, 'APPEND');
        };

        const handleMap = (innerOptions: VisitOptions) => {
          // [map, arrOut]
          sb.emitHelper(arg, innerOptions, sb.helpers.unwrapMap);
          // [arrOut, map]
          sb.emitOp(arg, 'SWAP');
          sb.emitHelper(
            arg,
            innerOptions,
            sb.helpers.mapReduce({
              each: handleMapLike,
            }),
          );
        };

        const handleSetLike = () => {
          // [value, arrOut, key]
          sb.emitOp(arg, 'ROT');
          // [arrOut, key]
          sb.emitOp(arg, 'DROP');
          // [arrOut, key, arrOut]
          sb.emitOp(arg, 'TUCK');
          // [key, arrOut, arrOut]
          sb.emitOp(arg, 'SWAP');
          // [arrOut]
          sb.emitOp(arg, 'APPEND');
        };

        const handleSet = (innerOptions: VisitOptions) => {
          // [map, arrOut]
          sb.emitHelper(arg, innerOptions, sb.helpers.unwrapSet);
          // [arrOut, map]
          sb.emitOp(arg, 'SWAP');
          sb.emitHelper(
            arg,
            innerOptions,
            sb.helpers.mapReduce({
              each: handleSetLike,
            }),
          );
        };

        const handleArrayStorage = (innerOptions: VisitOptions) => {
          // [arrOut, val]
          sb.emitOp(arg, 'SWAP');
          sb.emitHelper(
            arg,
            innerOptions,
            sb.helpers.structuredStorageReduceVal({
              type: Types.ArrayStorage,
              each: handleArrayLike,
            }),
          );
        };

        const handleMapStorage = (innerOptions: VisitOptions) => {
          // [arrOut, val]
          sb.emitOp(arg, 'SWAP');
          sb.emitHelper(
            arg,
            innerOptions,
            sb.helpers.structuredStorageReduce({
              type: Types.MapStorage,
              each: handleMapLike,
            }),
          );
        };

        const handleSetStorage = (innerOptions: VisitOptions) => {
          // [arrOut, val]
          sb.emitOp(arg, 'SWAP');
          sb.emitHelper(
            arg,
            innerOptions,
            sb.helpers.structuredStorageReduce({
              type: Types.SetStorage,
              each: handleSetLike,
            }),
          );
        };

        const handleIterableIterator = (innerOptions: VisitOptions) => {
          // [arrOut, val]
          sb.emitOp(arg, 'SWAP');
          sb.emitHelper(
            arg,
            innerOptions,
            sb.helpers.iterableIteratorReduce({
              each: handleArrayLike,
            }),
          );
        };

        if (ts.isSpreadElement(arg)) {
          const expr = tsUtils.expression.getExpression(arg);
          // [iterable, arr]
          sb.visit(expr, options);
          // [arr]
          sb.emitHelper(
            arg,
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
          sb.visit(arg, options);
          // [arr]
          sb.emitOp(node, 'APPEND');
        }
      });
    } else {
      const reversedElements = _.reverse([...args]);
      reversedElements.forEach((arg) => {
        sb.visit(arg, options);
      });
      // [length, ...vals]
      sb.emitPushInt(node, args.length);
      // [arr]
      sb.emitOp(node, 'PACK');
    }

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
