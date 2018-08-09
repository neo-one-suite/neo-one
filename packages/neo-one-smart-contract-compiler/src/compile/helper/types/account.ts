import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../Context';
import { IsHelper } from './IsHelper';
import { Types } from './Types';
import { UnwrapHelper } from './UnwrapHelper';
import { WrapHelper } from './WrapHelper';

export class UnwrapAccountHelper extends UnwrapHelper {}
export class WrapAccountHelper extends WrapHelper {
  protected readonly type = Types.Account;
}
export class IsAccountHelper extends IsHelper {
  protected readonly type = Types.Account;
}

export const hasAccount = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isAccount(context, node, tpe));

export const isOnlyAccount = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isAccount(context, node, tpe));

export const isAccount = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'Account');
