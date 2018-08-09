import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';

export const hasSymbol = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isSymbol(context, node, tpe));

export const isOnlySymbol = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isSymbol(context, node, tpe));

export const isSymbol = (_context: Context, _node: ts.Node, type: ts.Type): boolean => tsUtils.type_.isSymbolish(type);
