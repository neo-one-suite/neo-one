import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';
import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';
import { UnwrapHelper } from '../UnwrapHelper';
import { WrapHelper } from '../WrapHelper';

export class UnwrapContractPermissionHelper extends UnwrapHelper {}
export class WrapContractPermissionHelper extends WrapHelper {
  protected readonly type = Types.ContractPermission;
}
export class IsContractPermissionHelper extends IsHelper {
  protected readonly type = Types.ContractPermission;
}

export const hasContractPermission = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isContractPermission(context, node, tpe));

export const isOnlyContractPermission = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isContractPermission(context, node, tpe));

export const isContractPermission = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'ContractPermission');
