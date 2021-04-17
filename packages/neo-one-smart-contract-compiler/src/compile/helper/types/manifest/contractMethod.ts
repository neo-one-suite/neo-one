import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';
import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';
import { UnwrapHelper } from '../UnwrapHelper';
import { WrapHelper } from '../WrapHelper';

export class UnwrapContractMethodHelper extends UnwrapHelper {}
export class WrapContractMethodHelper extends WrapHelper {
  protected readonly type = Types.ContractMethod;
}
export class IsContractMethodHelper extends IsHelper {
  protected readonly type = Types.ContractMethod;
}

export const hasContractMethod = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isContractMethod(context, node, tpe));

export const isOnlyContractMethod = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isContractMethod(context, node, tpe));

export const isContractMethod = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'ContractMethodDescriptor');
