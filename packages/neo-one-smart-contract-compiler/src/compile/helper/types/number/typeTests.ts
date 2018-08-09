import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';

export const hasNumber = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isNumber(context, node, tpe));

export const isOnlyNumber = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isNumber(context, node, tpe));

export const isNumber = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isNumberish(type) || context.builtins.isType(node, type, 'Fixed');
