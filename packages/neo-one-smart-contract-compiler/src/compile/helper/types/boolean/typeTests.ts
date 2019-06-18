import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';

export const hasBooleanFalse = (_context: Context, _node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasBooleanFalse(type);

export const isBooleanFalse = (_context: Context, _node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isBooleanFalse(type);

export const hasBoolean = (_context: Context, _node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasBooleanish(type);

export const isOnlyBoolean = (_context: Context, _node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyBooleanish(type);

export const isBoolean = (_context: Context, _node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isBooleanish(type);
