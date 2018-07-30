import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

import { Types } from './Types';

export type PreferredType = 'default' | 'string' | 'number';
export interface ToPrimitiveHelperOptions {
  readonly type: ts.Type | undefined;
  readonly knownType?: Types;
  readonly preferredType?: PreferredType;
}

// NOTE: Unlike the other To* methods, this returns a wrapped value.
// Input: [val]
// Output: [val]
export class ToPrimitiveHelper extends Helper {
  private readonly type: ts.Type | undefined;
  private readonly knownType: Types | undefined;
  private readonly preferredType: PreferredType;

  public constructor({ type, knownType, preferredType = 'default' }: ToPrimitiveHelperOptions) {
    super();
    this.type = type;
    this.knownType = knownType;
    this.preferredType = preferredType;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    if (this.type === undefined || !tsUtils.type_.isOnlyPrimitiveish(this.type)) {
      if (this.type === undefined && this.knownType !== Types.Object) {
        this.toPrimitive(sb, node, options);
      } else {
        this.toPrimitiveObject(sb, node, options);
      }
    }
  }

  private toPrimitive(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [value, value]
          sb.emitOp(node, 'DUP');
          // [isObject, value]
          sb.emitHelper(node, options, sb.helpers.isObject);
        },
        whenTrue: () => {
          this.toPrimitiveObject(sb, node, options);
        },
      }),
    );
  }

  private toPrimitiveObject(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    // [value, value]
    sb.emitOp(node, 'DUP');
    // [symbol, value, value]
    sb.emitPushString(node, '@@toPrimitive');
    // [toPrimitive, value]
    sb.emitHelper(node, options, sb.helpers.getSymbolObjectProperty);
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [toPrimitive, toPrimitive, value]
          sb.emitOp(node, 'DUP');
          // [isUndefined, toPrimitive, value]
          sb.emitHelper(node, options, sb.helpers.isUndefined);
        },
        whenTrue: () => {
          // [value]
          sb.emitOp(node, 'DROP');
          // [value]
          this.tryConvert(sb, node, options, this.preferredType);
        },
        whenFalse: () => {
          // [preferredType, toPrimitiveVal, val]
          sb.emitPushString(node, this.preferredType);
          // [1, preferredType, toPrimitiveVal, val]
          sb.emitPushInt(node, 1);
          // [args, toPrimitiveVal, val]
          sb.emitOp(node, 'PACK');
          // [val, args, toPrimitiveVal]
          sb.emitOp(node, 'ROT');
          // [toPrimitiveVal, val, args]
          sb.emitOp(node, 'ROT');
          // [val]
          sb.emitHelper(node, options, sb.helpers.invokeCall({ bindThis: true }));
        },
      }),
    );
  }

  private tryConvert(
    sb: ScriptBuilder,
    node: ts.Node,
    options: VisitOptions,
    preferredType: 'string' | 'number' | 'default',
  ): void {
    const methods = preferredType === 'string' ? ['toString', 'valueOf'] : ['valueOf', 'toString'];
    // [value, value]
    sb.emitOp(node, 'DUP');
    // [method, value]
    sb.emitPushString(node, methods[0]);
    // [func, value]
    sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [func, func, value]
          sb.emitOp(node, 'DUP');
          // [isUndefined, func, value]
          sb.emitHelper(node, options, sb.helpers.isUndefined);
        },
        whenTrue: () => {
          // [value]
          sb.emitOp(node, 'DROP');
          // [value, value]
          sb.emitOp(node, 'DUP');
          // [method, value]
          sb.emitPushString(node, methods[1]);
          // [func, value]
          sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [func, func, value]
                sb.emitOp(node, 'DUP');
                // [isUndefined, func, value]
                sb.emitHelper(node, options, sb.helpers.isUndefined);
              },
              whenTrue: () => {
                // [value]
                sb.emitOp(node, 'DROP');
                // []
                sb.emitOp(node, 'DROP');
                // []
                sb.emitHelper(node, options, sb.helpers.throwTypeError);
              },
              whenFalse: () => {
                sb.emitHelper(node, options, sb.helpers.invokeCall({ bindThis: true, noArgs: true }));
              },
            }),
          );
        },
        whenFalse: () => {
          sb.emitHelper(node, options, sb.helpers.invokeCall({ bindThis: true, noArgs: true }));
        },
      }),
    );
  }
}
