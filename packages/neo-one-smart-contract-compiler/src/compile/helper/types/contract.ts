import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../Context';
import { IsHelper } from './IsHelper';
import { Types } from './Types';
import { UnwrapHelper } from './UnwrapHelper';
import { WrapHelper } from './WrapHelper';

export class UnwrapContractHelper extends UnwrapHelper {}
export class WrapContractHelper extends WrapHelper {
  protected readonly type = Types.Contract;
}
export class IsContractHelper extends IsHelper {
  protected readonly type = Types.Contract;
}

export const hasContract = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isContract(context, node, tpe));

export const isOnlyContract = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isContract(context, node, tpe));

export const isContract = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'Contract');
