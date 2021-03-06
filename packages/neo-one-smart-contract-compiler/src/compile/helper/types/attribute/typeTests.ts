import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';

export const hasAttribute = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isAttribute(context, node, tpe));

export const isOnlyAttribute = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isAttribute(context, node, tpe));

export const isAttribute = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'AttributeBase') ||
  context.builtins.isInterface(node, type, 'HighPriorityAttribute') ||
  context.builtins.isType(node, type, 'Attribute');
