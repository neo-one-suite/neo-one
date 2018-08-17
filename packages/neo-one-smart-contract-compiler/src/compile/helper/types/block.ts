import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../Context';
import { Types } from '../../constants';
import { IsHelper } from './IsHelper';
import { UnwrapHelper } from './UnwrapHelper';
import { WrapHelper } from './WrapHelper';

export class UnwrapBlockHelper extends UnwrapHelper {}
export class WrapBlockHelper extends WrapHelper {
  protected readonly type = Types.Block;
}
export class IsBlockHelper extends IsHelper {
  protected readonly type = Types.Block;
}

export const hasBlock = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isBlock(context, node, tpe));

export const isOnlyBlock = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isBlock(context, node, tpe));

export const isBlock = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'Block');
