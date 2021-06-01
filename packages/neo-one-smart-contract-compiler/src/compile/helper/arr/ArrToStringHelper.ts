import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { TypedHelper, TypedHelperOptions } from '../types';

export interface ArrToStringHelperOptions extends TypedHelperOptions {
  readonly hasJoinString?: boolean;
}

// Input: [joinString?, arr]
// Output: [string]
export class ArrToStringHelper extends TypedHelper {
  private readonly hasJoinString: boolean;

  public constructor({ type, knownType, hasJoinString = false }: ArrToStringHelperOptions) {
    super({ type, knownType });
    this.hasJoinString = hasJoinString;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      /* istanbul ignore next */
      sb.emitOp(node, 'DROP');

      /* istanbul ignore next */
      return;
    }

    const types = this.type === undefined ? [] : tsUtils.type_.getArrayTypes(this.type);
    const type = types.length === 1 ? tsUtils.type_.getArrayType(types[0]) : undefined;

    const joinString = sb.scope.addUnique();
    if (!this.hasJoinString) {
      sb.emitPushString(node, ',');
    }
    // [arr]
    sb.scope.set(sb, node, options, joinString);

    // [accum, arr]
    sb.emitPushString(node, '');
    // [accum]
    sb.emitHelper(
      node,
      options,
      sb.helpers.arrReduceWithoutIterator({
        withIndex: true,
        each: (innerOptions) => {
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [idx, accum, val]
                sb.emitOp(node, 'ROT');
                // [0, idx, accum, val]
                sb.emitPushInt(node, 0);
                // [idx === 0, accum, val]
                sb.emitOp(node, 'NUMEQUAL');
              },
              whenTrue: () => {
                // [val]
                sb.emitOp(node, 'DROP');
                // [accum]
                sb.emitHelper(node, innerOptions, sb.helpers.toString({ type, initial: false }));
              },
              whenFalse: () => {
                // [string, accum, val]
                sb.scope.get(sb, node, options, joinString);
                // [accum, val]
                sb.emitOp(node, 'CAT');
                // [val, accum]
                sb.emitOp(node, 'SWAP');
                // [string, accum]
                sb.emitHelper(node, innerOptions, sb.helpers.toString({ type, initial: false }));
                // [accum]
                sb.emitOp(node, 'CAT');
              },
            }),
          );
        },
      }),
    );
  }
}
