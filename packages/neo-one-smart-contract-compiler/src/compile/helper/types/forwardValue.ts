import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../Context';
import { Types } from '../../constants';
import { IsHelper } from './IsHelper';
import { UnwrapHelper } from './UnwrapHelper';
import { WrapHelper } from './WrapHelper';

export class UnwrapForwardValueHelper extends UnwrapHelper {}
export class WrapForwardValueHelper extends WrapHelper {
  protected readonly type = Types.ForwardValue;
}
export class IsForwardValueHelper extends IsHelper {
  protected readonly type = Types.ForwardValue;
}

export const hasForwardValue = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isForwardValue(context, node, tpe));

export const isOnlyForwardValue = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isForwardValue(context, node, tpe));

export const isForwardValue = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'ForwardValue');
