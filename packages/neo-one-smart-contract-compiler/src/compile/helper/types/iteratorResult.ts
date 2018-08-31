import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../Context';
import { Types } from '../../constants';
import { IsHelper } from './IsHelper';
import { UnwrapHelper } from './UnwrapHelper';
import { WrapHelper } from './WrapHelper';

export class UnwrapIteratorResultHelper extends UnwrapHelper {}
export class WrapIteratorResultHelper extends WrapHelper {
  protected readonly type = Types.IteratorResult;
}
export class IsIteratorResultHelper extends IsHelper {
  protected readonly type = Types.IteratorResult;
}

export const hasIteratorResult = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isIteratorResult(context, node, tpe));

export const isOnlyIteratorResult = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isIteratorResult(context, node, tpe));

export const isIteratorResult = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'IteratorResult');
