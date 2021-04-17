import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';
import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';
import { UnwrapHelper } from '../UnwrapHelper';
import { WrapHelper } from '../WrapHelper';

export class UnwrapContractABIHelper extends UnwrapHelper {}
export class WrapContractABIHelper extends WrapHelper {
  protected readonly type = Types.ContractABI;
}
export class IsContractABIHelper extends IsHelper {
  protected readonly type = Types.ContractABI;
}

export const hasContractABI = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isContractABI(context, node, tpe));

export const isOnlyContractABI = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isContractABI(context, node, tpe));

export const isContractABI = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'ContractABI');
