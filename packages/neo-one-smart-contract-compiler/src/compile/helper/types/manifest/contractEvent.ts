import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';
import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';
import { UnwrapHelper } from '../UnwrapHelper';
import { WrapHelper } from '../WrapHelper';

export class UnwrapContractEventHelper extends UnwrapHelper {}
export class WrapContractEventHelper extends WrapHelper {
  protected readonly type = Types.ContractEvent;
}
export class IsContractEventHelper extends IsHelper {
  protected readonly type = Types.ContractEvent;
}

export const hasContractEvent = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isContractEvent(context, node, tpe));

export const isOnlyContractEvent = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isContractEvent(context, node, tpe));

export const isContractEvent = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'ContractEventDescriptor');
