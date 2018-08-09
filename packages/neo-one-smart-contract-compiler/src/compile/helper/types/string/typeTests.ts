import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';

export const hasString = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isString(context, node, tpe));

export const isOnlyString = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isString(context, node, tpe));

export const isString = (_context: Context, _node: ts.Node, type: ts.Type): boolean => tsUtils.type_.isStringish(type);
