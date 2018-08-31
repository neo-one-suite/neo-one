import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../Context';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [val]
// Output: [boolean]
export class IsIterableHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      sb.emitOp(node, 'DROP');

      return;
    }

    const pushTrue = () => {
      sb.emitPushBoolean(node, true);
    };

    const pushFalse = () => {
      sb.emitPushBoolean(node, false);
    };

    sb.emitHelper(
      node,
      options,
      sb.helpers.forIterableType({
        array: pushTrue,
        map: pushTrue,
        set: pushTrue,
        arrayStorage: pushTrue,
        mapStorage: pushTrue,
        setStorage: pushTrue,
        iterableIterator: pushTrue,
        defaultCase: pushFalse,
      }),
    );
  }
}

export const hasIterable = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isIterable(context, node, tpe));

export const isOnlyIterable = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isIterable(context, node, tpe));

export const isIterable = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'Iterable');
