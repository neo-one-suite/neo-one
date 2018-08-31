import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../Context';
import { Types } from '../../constants';
import { IsHelper } from './IsHelper';
import { UnwrapHelper } from './UnwrapHelper';
import { WrapHelper } from './WrapHelper';

export class UnwrapMapHelper extends UnwrapHelper {}
export class WrapMapHelper extends WrapHelper {
  protected readonly type = Types.Map;
}
export class IsMapHelper extends IsHelper {
  protected readonly type = Types.Map;
}

export const hasMap = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isMap(context, node, tpe));

export const isOnlyMap = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isMap(context, node, tpe));

export const isMap = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'Map') || context.builtins.isInterface(node, type, 'ReadonlyMap');
