import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../Context';
import { Types } from '../../constants';
import { IsHelper } from './IsHelper';
import { UnwrapHelper } from './UnwrapHelper';
import { WrapHelper } from './WrapHelper';

export class UnwrapAssetHelper extends UnwrapHelper {}
export class WrapAssetHelper extends WrapHelper {
  protected readonly type = Types.Asset;
}
export class IsAssetHelper extends IsHelper {
  protected readonly type = Types.Asset;
}

export const hasAsset = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isAsset(context, node, tpe));

export const isOnlyAsset = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isAsset(context, node, tpe));

export const isAsset = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'Asset');
