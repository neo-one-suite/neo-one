import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../Context';
import { Types } from '../../constants';
import { IsHelper } from './IsHelper';
import { UnwrapHelper } from './UnwrapHelper';
import { WrapHelper } from './WrapHelper';

export class UnwrapSetHelper extends UnwrapHelper {}
export class WrapSetHelper extends WrapHelper {
  protected readonly type = Types.Set;
}
export class IsSetHelper extends IsHelper {
  protected readonly type = Types.Set;
}

export const hasSet = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isSet(context, node, tpe));

export const isOnlySet = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isSet(context, node, tpe));

export const isSet = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'Set') || context.builtins.isInterface(node, type, 'ReadonlySet');
