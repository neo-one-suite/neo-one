import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';

export const hasBoolean = (_context: Context, _node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasBooleanish(type);

export const isOnlyBoolean = (_context: Context, _node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyBooleanish(type);

export const isBoolean = (_context: Context, _node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isBooleanish(type);
