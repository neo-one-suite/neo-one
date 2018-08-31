import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../Context';
import { Types } from '../../constants';
import { IsHelper } from './IsHelper';
import { UnwrapHelper } from './UnwrapHelper';
import { WrapHelper } from './WrapHelper';

export class UnwrapArrayStorageHelper extends UnwrapHelper {}
export class WrapArrayStorageHelper extends WrapHelper {
  protected readonly type = Types.ArrayStorage;
}
export class IsArrayStorageHelper extends IsHelper {
  protected readonly type = Types.ArrayStorage;
}

export const hasArrayStorage = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isArrayStorage(context, node, tpe));

export const isOnlyArrayStorage = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isArrayStorage(context, node, tpe));

export const isArrayStorage = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'ArrayStorage');
