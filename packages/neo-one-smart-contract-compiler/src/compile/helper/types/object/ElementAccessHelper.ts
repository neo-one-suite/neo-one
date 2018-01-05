import { ElementAccessExpression, Node, Type, ts } from 'ts-simple-ast';

import { Helper } from '../../Helper';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';

import * as typeUtils from '../../../../typeUtils';

// Input: [val]
// Output: [val]
export class ElementAccessHelper extends Helper<ElementAccessExpression> {
  public emit(
    sb: ScriptBuilder,
    expr: ElementAccessExpression,
    optionsIn: VisitOptions,
  ): void {
    const options = sb.pushValueOptions(sb.noSetValueOptions(optionsIn));
    const value = expr.getExpression();
    const valueType = sb.getType(value);
    const prop = expr.getArgumentExpressionOrThrow();
    const propType = sb.getType(prop);

    // [objectVal]
    sb.emitHelper(
      value,
      options,
      sb.helpers.toObject({ type: sb.getType(value) }),
    );

    // [propVal, objectVal]
    sb.visit(prop, options);

    if (optionsIn.setValue) {
      let valueIndex = 2;
      if (optionsIn.pushValue) {
        // [objectVal, propVal]
        sb.emitOp(expr, 'SWAP');
        // [objectVal, propVal, objectVal]
        sb.emitOp(expr, 'TUCK');
        // [propVal, objectVal, propVal, objectVal]
        sb.emitOp(expr, 'OVER');
        valueIndex = 4;
      }

      if (typeUtils.isOnlyString(propType)) {
        // [propString, objectVal]
        sb.emitHelper(prop, options, sb.helpers.getString);
        // []
        this.setProperty(sb, prop, options, valueIndex);
      } else if (typeUtils.isOnlyNumber(propType)) {
        // []
        this.setNumberProperty(
          sb,
          prop,
          options,
          propType,
          valueType,
          valueIndex,
        );
      } else if (typeUtils.isOnlySymbol(propType)) {
        // [propString, objectVal]
        sb.emitHelper(prop, options, sb.helpers.getSymbol);
        // []
        this.setSymbol(sb, prop, options, valueIndex);
      } else {
        // []
        sb.emitHelper(
          prop,
          options,
          sb.helpers.case(
            [
              {
                condition: () => {
                  // [propVal, propVal, objectVal]
                  sb.emitOp(prop, 'DUP');
                  // [isString, propVal, objectVal]
                  sb.emitHelper(prop, options, sb.helpers.isString);
                },
                whenTrue: () => {
                  // [propString, objectVal]
                  sb.emitHelper(prop, options, sb.helpers.getString);
                  // []
                  this.setProperty(sb, prop, options, valueIndex);
                },
              },
              {
                condition: () => {
                  // [propVal, propVal, objectVal]
                  sb.emitOp(prop, 'DUP');
                  // [isNumber, propVal, objectVal]
                  sb.emitHelper(prop, options, sb.helpers.isNumber);
                },
                whenTrue: () => {
                  // []
                  this.setNumberProperty(
                    sb,
                    prop,
                    options,
                    propType,
                    valueType,
                    valueIndex,
                  );
                },
              },
            ],
            () => {
              // [propString, objectVal]
              sb.emitHelper(prop, options, sb.helpers.getSymbol);
              // []
              this.setSymbol(sb, prop, options, valueIndex);
            },
          ),
        );
      }
    }

    if (optionsIn.pushValue || !optionsIn.setValue) {
      if (typeUtils.isOnlyString(propType)) {
        // [propString, objectVal]
        sb.emitHelper(prop, options, sb.helpers.getString);
        // [val]
        sb.emitHelper(expr, options, sb.helpers.getPropertyObjectProperty);
      } else if (typeUtils.isOnlyNumber(propType)) {
        // [val]
        this.getNumberProperty(sb, prop, options, propType, valueType);
      } else if (typeUtils.isOnlySymbol(propType)) {
        // [propString, objectVal]
        sb.emitHelper(prop, options, sb.helpers.getSymbol);
        // [val]
        sb.emitHelper(expr, options, sb.helpers.getSymbolObjectProperty);
      } else {
        // [val]
        sb.emitHelper(
          prop,
          options,
          sb.helpers.case(
            [
              {
                condition: () => {
                  // [propVal, propVal, objectVal]
                  sb.emitOp(prop, 'DUP');
                  // [propVal, objectVal]
                  sb.emitHelper(prop, options, sb.helpers.isString);
                },
                whenTrue: () => {
                  // [propString, objectVal]
                  sb.emitHelper(prop, options, sb.helpers.getString);
                  // [val]
                  sb.emitHelper(
                    expr,
                    options,
                    sb.helpers.getPropertyObjectProperty,
                  );
                },
              },
              {
                condition: () => {
                  // [propVal, propVal, objectVal]
                  sb.emitOp(prop, 'DUP');
                  // [propVal, objectVal]
                  sb.emitHelper(prop, options, sb.helpers.isNumber);
                },
                whenTrue: () => {
                  // [val]
                  this.getNumberProperty(
                    sb,
                    prop,
                    options,
                    propType,
                    valueType,
                  );
                },
              },
            ],
            () => {
              // [propString, objectVal]
              sb.emitHelper(prop, options, sb.helpers.getSymbol);
              // [val]
              sb.emitHelper(expr, options, sb.helpers.getSymbolObjectProperty);
            },
          ),
        );
      }
    }

    if (!optionsIn.pushValue && !optionsIn.setValue) {
      sb.emitOp(expr, 'DROP');
    }
  }

  private getNumberProperty(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    propType: Type<ts.Type> | undefined,
    valueType: Type<ts.Type> | undefined,
  ): void {
    if (typeUtils.isOnlyArray(valueType) || typeUtils.isOnlyTuple(valueType)) {
      sb.emitHelper(node, options, sb.helpers.getNumber);
      sb.emitHelper(node, options, sb.helpers.getArrayIndex);
    } else {
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [isArray, propVal, objectVal]
            this.isArrayInstance(sb, node, options);
          },
          whenTrue: () => {
            // [propNumber, objectVal]
            sb.emitHelper(node, options, sb.helpers.getNumber);
            // [val]
            sb.emitHelper(node, options, sb.helpers.getArrayIndex);
          },
          whenFalse: () => {
            // [propString, objectVal]
            sb.emitHelper(
              node,
              options,
              sb.helpers.toString({ type: propType }),
            );
            // [val]
            sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
          },
        }),
      );
    }
  }

  private setProperty(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    index: number,
  ): void {
    // [val, propString, objectVal]
    this.pickValue(sb, node, options, index);
    // []
    sb.emitHelper(node, options, sb.helpers.setPropertyObjectProperty);
  }

  private setNumberProperty(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    propType: Type<ts.Type> | undefined,
    valueType: Type<ts.Type> | undefined,
    index: number,
  ): void {
    if (typeUtils.isOnlyArray(valueType) || typeUtils.isOnlyTuple(valueType)) {
      sb.emitHelper(node, options, sb.helpers.getNumber);
      this.setArrayIndex(sb, node, options, index);
    } else {
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [isArray, propVal, objectVal]
            this.isArrayInstance(sb, node, options);
          },
          whenTrue: () => {
            sb.emitHelper(node, options, sb.helpers.getNumber);
            this.setArrayIndex(sb, node, options, index);
          },
          whenFalse: () => {
            // [propString, objectVal]
            sb.emitHelper(
              node,
              options,
              sb.helpers.toString({ type: propType }),
            );
            // []
            this.setProperty(sb, node, options, index);
          },
        }),
      );
    }
  }

  private setArrayIndex(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    index: number,
  ): void {
    // [val, propNumber, objectVal]
    this.pickValue(sb, node, options, index);
    // []
    sb.emitHelper(node, options, sb.helpers.setArrayIndex);
  }

  private setSymbol(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    index: number,
  ): void {
    // [val, propString, objectVal]
    this.pickValue(sb, node, options, index);
    // []
    sb.emitHelper(node, options, sb.helpers.setSymbolObjectProperty);
  }

  private isArrayInstance(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
  ): void {
    // [objectVal, propVal, objectVal]
    sb.emitOp(node, 'OVER');
    // [Array, objectVal, propVal, objectVal]
    sb.emitHelper(
      node,
      options,
      sb.helpers.getGlobalProperty({ property: 'Array' }),
    );
    // [isArray, propVal, objectVal]
    sb.emitHelper(node, options, sb.helpers.instanceof);
  }

  private pickValue(
    sb: ScriptBuilder,
    node: Node,
    options: VisitOptions,
    index: number,
  ): void {
    if (index === 2) {
      sb.emitOp(node, 'ROT');
    } else {
      // [index, ...]
      sb.emitPushInt(node, index);
      // [val, ...]
      sb.emitOp(node, 'ROLL');
    }
  }
}
