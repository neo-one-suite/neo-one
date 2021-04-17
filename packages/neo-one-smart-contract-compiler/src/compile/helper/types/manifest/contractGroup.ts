import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';
import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';
import { UnwrapHelper } from '../UnwrapHelper';
import { WrapHelper } from '../WrapHelper';

export class UnwrapContractGroupHelper extends UnwrapHelper {}
export class WrapContractGroupHelper extends WrapHelper {
  protected readonly type = Types.ContractGroup;
}
export class IsContractGroupHelper extends IsHelper {
  protected readonly type = Types.ContractGroup;
}

export const hasContractGroup = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isContractGroup(context, node, tpe));

export const isOnlyContractGroup = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isContractGroup(context, node, tpe));

export const isContractGroup = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'ContractGroup');
