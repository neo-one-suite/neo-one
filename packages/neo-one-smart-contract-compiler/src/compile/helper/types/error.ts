import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../Context';
import { Types } from '../../constants';
import { IsHelper } from './IsHelper';
import { UnwrapHelper } from './UnwrapHelper';
import { WrapHelper } from './WrapHelper';

export class UnwrapErrorHelper extends UnwrapHelper {}
export class WrapErrorHelper extends WrapHelper {
  protected readonly type = Types.Error;
}
export class IsErrorHelper extends IsHelper {
  protected readonly type = Types.Error;
}

export const hasError = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isError(context, node, tpe));

export const isOnlyError = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isError(context, node, tpe));

export const isError = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'Error');
