import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../Context';
import { Types } from '../../constants';
import { IsHelper } from './IsHelper';
import { UnwrapHelper } from './UnwrapHelper';
import { WrapHelper } from './WrapHelper';

export class UnwrapMapStorageHelper extends UnwrapHelper {}
export class WrapMapStorageHelper extends WrapHelper {
  protected readonly type = Types.MapStorage;
}
export class IsMapStorageHelper extends IsHelper {
  protected readonly type = Types.MapStorage;
}

export const hasMapStorage = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isMapStorage(context, node, tpe));

export const isOnlyMapStorage = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isMapStorage(context, node, tpe));

export const isMapStorage = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'MapStorage');
