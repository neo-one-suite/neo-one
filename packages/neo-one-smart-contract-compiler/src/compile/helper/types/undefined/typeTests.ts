import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';

export const hasUndefined = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isUndefined(context, node, tpe));

export const isOnlyUndefined = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isUndefined(context, node, tpe));

export const isUndefined = (_context: Context, _node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isUndefinedish(type);
