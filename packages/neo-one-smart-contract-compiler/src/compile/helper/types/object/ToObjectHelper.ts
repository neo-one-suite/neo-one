import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { TypedHelper } from '../../common';

import * as typeUtils from '../../../../typeUtils';

// Input: [val]
// Output: [objectVal]
export class ToObjectHelper extends TypedHelper {
  public emit(sb: ScriptBuilder, node: Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    const type = this.type;
    if (typeUtils.isOnlyBoolean(type)) {
      this.convertPrimitive(sb, node, options, 'Boolean');
    } else if (typeUtils.isOnlyNumber(type)) {
      this.convertPrimitive(sb, node, options, 'Number');
    } else if (typeUtils.isOnlyString(type)) {
      this.convertPrimitive(sb, node, options, 'String');
    } else if (typeUtils.isOnlySymbol(type)) {
      this.convertPrimitive(sb, node, options, 'Symbol');
    } else if (typeUtils.isOnlyObject(type)) {
      return;
    } else {
      sb.emitHelper(
        node,
        options,
        sb.helpers.case(
          [
            {
              condition: () => {
                // [val, val]
                sb.emitOp(node, 'DUP');
                // [isObject, val]
                sb.emitHelper(node, options, sb.helpers.isObject);
              },
              whenTrue: () => {
                // do nothing
              },
            },
          ].concat(
            [
              { helper: sb.helpers.isBoolean, primitive: 'Boolean' },
              { helper: sb.helpers.isNumber, primitive: 'Number' },
              { helper: sb.helpers.isString, primitive: 'String' },
              { helper: sb.helpers.isSymbol, primitive: 'Symbol' },
            ].map(({ helper, primitive }) => ({
              condition: () => {
                // [val, val]
                sb.emitOp(node, 'DUP');
                // [isObject, val]
                sb.emitHelper(node, options, helper);
              },
              whenTrue: () => {
                this.convertPrimitive(sb, node, options, primitive);
              },
            })),
          ),
          () => {
            sb.emitHelper(node, options, sb.helpers.throwTypeError);
          },
        ),
      );
    }
  }

  public convertPrimitive(sb: ScriptBuilder, node: Node, options: VisitOptions, primitive: string): void {
    // [1, val]
    sb.emitPushInt(node, 1);
    // [valArgsArray]
    sb.emitOp(node, 'PACK');
    // [globalObjectVal, valArgsArray]
    sb.scope.getGlobal(sb, node, options);
    // [primitiveString, globalObjectVal, valArgsArray]
    sb.emitPushString(node, primitive);
    // [primitiveObjectVal, valArgsArray]
    sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
    // [val]
    sb.emitHelper(node, options, sb.helpers.invokeCall());
  }
}
