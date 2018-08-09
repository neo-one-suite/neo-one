import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';

export const hasBuffer = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isBuffer(context, node, tpe));

export const isOnlyBuffer = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isBuffer(context, node, tpe));

export const isBuffer = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'Buffer') ||
  context.builtins.isInterface(node, type, 'Hash256') ||
  context.builtins.isInterface(node, type, 'PublicKey') ||
  context.builtins.isInterface(node, type, 'Address');
