import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ParametersHelperOptions {
  readonly params: ReadonlyArray<ts.ParameterDeclaration>;
  readonly onStack?: boolean;
  readonly map?: (param: ts.ParameterDeclaration, options: VisitOptions) => void;
}

// Input: [argsArray]
// Output: []
export class ParametersHelper extends Helper {
  private readonly params: ReadonlyArray<ts.ParameterDeclaration>;
  private readonly onStack: boolean;
  private readonly map?: (param: ts.ParameterDeclaration, options: VisitOptions) => void;

  public constructor(options: ParametersHelperOptions) {
    super();
    this.params = options.params;
    this.onStack = options.onStack === undefined ? false : options.onStack;
    this.map = options.map;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    const params = this.params;
    const restElement = params.find((param) => tsUtils.parameter.isRestParameter(param));
    let parameters = restElement === undefined ? [...params] : params.slice(0, -1);
    parameters =
      parameters.length > 0 && tsUtils.node.getName(parameters[0]) === 'this' ? parameters.slice(1) : parameters;
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
              // [size <= idx, argsarr]
              sb.emitOp(param, 'LTE');
            },
            whenTrue: () => {
              // [undefinedVal, argsarr]
              sb.emitHelper(param, sb.pushValueOptions(options), sb.helpers.wrapUndefined);
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

      if (this.map !== undefined) {
        // tslint:disable-next-line no-map-without-usage
        this.map(param, options);
      }

      if (this.onStack) {
        // [number, val, argsarr]
        sb.emitPushInt(node, idx + 2);
        // [val, argsarr, val]
        sb.emitOp(node, 'XTUCK');
        // [argsarr, val]
        sb.emitOp(node, 'DROP');
      } else if (ts.isIdentifier(nameNode)) {
        // [argsarr]
        sb.scope.set(sb, node, options, tsUtils.node.getText(nameNode));
      } else {
        // [argsarr]
        sb.visit(nameNode, options);
      }
    });

    if (restElement === undefined) {
      // []
      sb.emitOp(node, 'DROP');
    } else {
      sb.scope.add(tsUtils.node.getNameOrThrow(restElement));

      // [number, argsarr]
      sb.emitPushInt(restElement, parameters.length);
      // [arr]
      sb.emitHelper(restElement, options, sb.helpers.arrSlice({ hasEnd: false }));
      // [arrayVal]
      sb.emitHelper(restElement, options, sb.helpers.wrapArray);

      if (this.map !== undefined) {
        // tslint:disable-next-line no-map-without-usage
        this.map(restElement, options);
      }

      if (this.onStack) {
        // [number, val]
        sb.emitPushInt(node, params.length);
        // [val, val]
        sb.emitOp(node, 'XTUCK');
        // [val]
        sb.emitOp(node, 'DROP');
      } else {
        // []
        sb.scope.set(sb, restElement, options, tsUtils.node.getNameOrThrow(restElement));
      }
    }
  }
}
