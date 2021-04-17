import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';
import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';
import { UnwrapHelper } from '../UnwrapHelper';
import { WrapHelper } from '../WrapHelper';

export class UnwrapContractParameterHelper extends UnwrapHelper {}
export class WrapContractParameterHelper extends WrapHelper {
  protected readonly type = Types.ContractParameter;
}
export class IsContractParameterHelper extends IsHelper {
  protected readonly type = Types.ContractParameter;
}

export const hasContractParameter = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isContractParameter(context, node, tpe));

export const isOnlyContractParameter = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isContractParameter(context, node, tpe));

export const isContractParameter = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'ContractParameterDefinition');
