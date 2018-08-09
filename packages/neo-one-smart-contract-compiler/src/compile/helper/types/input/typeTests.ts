import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';

export const hasInput = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isInput(context, node, tpe));

export const isOnlyInput = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isInput(context, node, tpe));

export const isInput = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'Input');
