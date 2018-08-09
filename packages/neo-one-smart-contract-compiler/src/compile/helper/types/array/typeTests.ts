import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';

export const hasArray = (_context: Context, _node: ts.Node, type: ts.Type): boolean => tsUtils.type_.hasArrayish(type);

export const isOnlyArray = (_context: Context, _node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyArrayish(type);

export const isArray = (_context: Context, _node: ts.Node, type: ts.Type): boolean => tsUtils.type_.isArrayish(type);
