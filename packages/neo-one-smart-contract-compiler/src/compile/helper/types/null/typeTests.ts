import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';

export const hasNull = (_context: Context, _node: ts.Node, type: ts.Type): boolean => tsUtils.type_.hasNull(type);

export const isOnlyNull = (_context: Context, _node: ts.Node, type: ts.Type): boolean => tsUtils.type_.isOnlyNull(type);

export const isNull = (_context: Context, _node: ts.Node, type: ts.Type): boolean => tsUtils.type_.isNull(type);
