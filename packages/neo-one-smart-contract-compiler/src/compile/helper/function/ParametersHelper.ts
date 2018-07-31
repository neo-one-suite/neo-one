import { ParameteredNode, tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [argsArray]
// Output: []
export class ParametersHelper extends Helper<ParameteredNode> {
  public emit(sb: ScriptBuilder, node: ParameteredNode, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    const params = tsUtils.parametered.getParameters(node);
    const restElement = params.find((param) => tsUtils.parameter.isRestParameter(param));
    const parameters = restElement === undefined ? [...params] : params.slice(0, -1);
    // [argsarr]
    parameters.forEach((param, idx) => {
      const nameNode = tsUtils.node.getNameNode(param);

      if (ts.isIdentifier(nameNode)) {
        sb.scope.add(tsUtils.node.getText(nameNode));
      }

      const initializer = tsUtils.initializer.getInitializer(param);
      if (initializer !== undefined) {
        sb.emitHelper(
          param,
          sb.noPushValueOptions(options),
          sb.helpers.if({
            condition: () => {
              // [argsarr, argsarr]
              sb.emitOp(param, 'DUP');
              // [size, argsarr]
              sb.emitOp(param, 'ARRAYSIZE');
              // [idx, size, argsarr]
              sb.emitPushInt(param, idx);
              // [lt, argsarr]
              sb.emitOp(param, 'LTE');
            },
            whenTrue: () => {
              // [default, argsarr]
              sb.visit(initializer, sb.pushValueOptions(options));
            },
            whenFalse: () => {
              // [argsarr, argsarr]
              sb.emitOp(param, 'DUP');
              // [idx, argsarr, argsarr]
              sb.emitPushInt(param, idx);
              // [arg, argsarr]
              sb.emitOp(param, 'PICKITEM');
              // [arg, arg, argsarr]
              sb.emitOp(param, 'DUP');
              sb.emitHelper(
                param,
                sb.noPushValueOptions(options),
                sb.helpers.if({
                  condition: () => {
                    // [isUndefined, arg, argsarr]
                    sb.emitHelper(param, sb.pushValueOptions(options), sb.helpers.isUndefined);
                  },
                  whenTrue: () => {
                    // [argsarr]
                    sb.emitOp(param, 'DROP');
                    // [default, argsarr]
                    sb.visit(initializer, sb.pushValueOptions(options));
                  },
                }),
              );
            },
          }),
        );
      } else if (tsUtils.parameter.isOptional(param)) {
        sb.emitHelper(
          param,
          sb.noPushValueOptions(options),
          sb.helpers.if({
            condition: () => {
              // [argsarr, argsarr]
              sb.emitOp(param, 'DUP');
              // [size, argsarr]
              sb.emitOp(param, 'ARRAYSIZE');
              // [idx, size, argsarr]
              sb.emitPushInt(param, idx);
              // [lt, argsarr]
              sb.emitOp(param, 'LT');
            },
            whenTrue: () => {
              // [undefinedVal, argsarr]
              sb.emitHelper(param, sb.pushValueOptions(options), sb.helpers.createUndefined);
            },
            whenFalse: () => {
              // [argsarr, argsarr]
              sb.emitOp(param, 'DUP');
              // [idx, argsarr, argsarr]
              sb.emitPushInt(param, idx);
              // [arg, argsarr]
              sb.emitOp(param, 'PICKITEM');
            },
          }),
        );
      } else {
        // [argsarr, argsarr]
        sb.emitOp(param, 'DUP');
        // [idx, argsarr, argsarr]
        sb.emitPushInt(param, idx);
        // [arg, argsarr]
        sb.emitOp(param, 'PICKITEM');
      }

      // [argsarr]
      if (ts.isIdentifier(nameNode)) {
        sb.scope.set(sb, node, options, tsUtils.node.getText(nameNode));
      } else {
        sb.visit(nameNode, options);
      }
    });

    if (restElement === undefined) {
      // []
      sb.emitOp(node, 'DROP');
    } else {
      sb.scope.add(tsUtils.node.getNameOrThrow(restElement));

      // [number, argsarr]
      sb.emitPushInt(node, parameters.length + 1);
      // [arr]
      sb.emitHelper(node, options, sb.helpers.arrSlice({ hasEnd: false }));
      // [arrayVal]
      sb.emitHelper(node, options, sb.helpers.wrapArray);
      // []
      sb.scope.set(sb, node, options, tsUtils.node.getNameOrThrow(restElement));
    }
  }
}
