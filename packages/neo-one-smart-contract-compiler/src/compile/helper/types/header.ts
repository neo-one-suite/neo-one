import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../Context';
import { Types } from '../../constants';
import { IsHelper } from './IsHelper';
import { UnwrapHelper } from './UnwrapHelper';
import { WrapHelper } from './WrapHelper';

export class UnwrapHeaderHelper extends UnwrapHelper {}
export class WrapHeaderHelper extends WrapHelper {
  protected readonly type = Types.Header;
}
export class IsHeaderHelper extends IsHelper {
  protected readonly type = Types.Header;
}

export const hasHeader = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isHeader(context, node, tpe));

export const isOnlyHeader = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isHeader(context, node, tpe));

export const isHeader = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'Header');
