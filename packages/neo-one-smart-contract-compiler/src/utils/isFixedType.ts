import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../Context';

export const isFixedType = (context: Context, node: ts.Node, type: ts.Type | undefined): boolean => {
  if (type === undefined) {
    return false;
  }

  const aliasSymbol = tsUtils.type_.getAliasSymbol(type);

  return context.isLibSymbol(
    node,
    aliasSymbol === undefined ? context.getSymbolForType(node, type) : aliasSymbol,
    'Fixed',
  );
};
