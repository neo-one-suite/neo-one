import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../Context';
import { Types } from '../../constants';
import { IsHelper } from './IsHelper';
import { UnwrapHelper } from './UnwrapHelper';
import { WrapHelper } from './WrapHelper';

export class UnwrapSetStorageHelper extends UnwrapHelper {}
export class WrapSetStorageHelper extends WrapHelper {
  protected readonly type = Types.SetStorage;
}
export class IsSetStorageHelper extends IsHelper {
  protected readonly type = Types.SetStorage;
}

export const hasSetStorage = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isSetStorage(context, node, tpe));

export const isOnlySetStorage = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isSetStorage(context, node, tpe));

export const isSetStorage = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'SetStorage');
