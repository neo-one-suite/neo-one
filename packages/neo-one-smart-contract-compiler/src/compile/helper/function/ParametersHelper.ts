import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export interface ParametersHelperOptions {
  readonly params: readonly ts.ParameterDeclaration[];
  readonly asArgsArr?: boolean;
  readonly map?: (param: ts.ParameterDeclaration, options: VisitOptions, isRestElement?: boolean) => void;
  readonly mapParam?: (param: ts.ParameterDeclaration, options: VisitOptions) => void;
}

// Input: [argsarr]
// Output: []
export class ParametersHelper extends Helper {
  private readonly params: readonly ts.ParameterDeclaration[];
  private readonly asArgsArr: boolean;
  private readonly map?: (param: ts.ParameterDeclaration, options: VisitOptions, isRestElement?: boolean) => void;
  private readonly mapParam?: (param: ts.ParameterDeclaration, options: VisitOptions) => void;

  public constructor(options: ParametersHelperOptions) {
    super();
    this.params = options.params;
    this.asArgsArr = options.asArgsArr === undefined ? false : options.asArgsArr;
    this.map = options.map;
    this.mapParam = options.mapParam;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    const params = this.params;
    const restElement = params.find((param) => tsUtils.parameter.isRestParameter(param));
    let parameters = restElement === undefined ? [...params] : params.slice(0, -1);
    parameters =
      parameters.length > 0 && tsUtils.node.getName(parameters[0]) === 'this' ? parameters.slice(1) : parameters;
    if (this.asArgsArr) {
      // [0, argsarr]
      sb.emitPushInt(node, 0);
      // [outputarr, argsarr]
      sb.emitOp(node, 'NEWARRAY');
      // [argsarr, outputarr]
      sb.emitOp(node, 'SWAP');
    }
    // [argsarr, outputarr]
    parameters.forEach((param, idx) => {
      const nameNode = tsUtils.node.getNameNode(param);

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
              if (this.mapParam !== undefined) {
                this.mapParam(param, options);
              }
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
              if (this.mapParam !== undefined) {
                this.mapParam(param, options);
              }
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
        if (this.mapParam !== undefined) {
          this.mapParam(param, options);
        }
      }

      if (this.map !== undefined) {
        // tslint:disable-next-line no-map-without-usage
        this.map(param, options);
      }

      if (this.asArgsArr) {
        // [outputarr, val, argsarr]
        sb.emitOp(node, 'ROT');
        // [outputarr, val, outputarr, argsarr]
        sb.emitOp(node, 'TUCK');
        // [val, outputarr, outputarr, argsarr]
        sb.emitOp(node, 'SWAP');
        // [outputarr, argsarr]
        sb.emitOp(node, 'APPEND');
        // [argsarr, outputarr]
        sb.emitOp(node, 'SWAP');
      } else if (ts.isIdentifier(nameNode)) {
        sb.scope.add(tsUtils.node.getText(nameNode));
        // [argsarr]
        sb.scope.set(sb, node, options, tsUtils.node.getText(nameNode));
      } else if (ts.isArrayBindingPattern(nameNode)) {
        const paramType = sb.context.analysis.getType(param);
        sb.emitHelper(nameNode, options, sb.helpers.arrayBinding({ type: paramType }));
      } else {
        const paramType = sb.context.analysis.getType(param);
        sb.emitHelper(nameNode, options, sb.helpers.objectBinding({ type: paramType }));
      }
    });

    if (restElement === undefined) {
      // [outputarr?]
      sb.emitOp(node, 'DROP');
    } else {
      // [number, argsarr, outputarr?]
      sb.emitPushInt(restElement, parameters.length);
      // [arr, outputarr?]
      sb.emitHelper(restElement, options, sb.helpers.arrSlice({ hasEnd: false }));
      const mapParam = this.mapParam;
      if (mapParam !== undefined) {
        sb.emitHelper(
          restElement,
          options,
          sb.helpers.arrMap({
            map: (innerOptions) => mapParam(restElement, innerOptions),
          }),
        );
      }

      if (this.asArgsArr) {
        const map = this.map;
        if (map !== undefined) {
          // tslint:disable-next-line no-map-without-usage
          sb.emitHelper(
            restElement,
            options,
            sb.helpers.arrMap({
              map: (innerOptions) => map(restElement, innerOptions, true),
            }),
          );
        }
        // [outputarr]
        sb.emitHelper(node, options, sb.helpers.arrConcat);
      } else {
        // [arrayVal, outputarr?]
        sb.emitHelper(restElement, options, sb.helpers.wrapArray);

        if (this.map !== undefined) {
          // tslint:disable-next-line no-map-without-usage
          this.map(restElement, options);
        }

        sb.scope.add(tsUtils.node.getNameOrThrow(restElement));
        // []
        sb.scope.set(sb, restElement, options, tsUtils.node.getNameOrThrow(restElement));
      }
    }
  }
}
