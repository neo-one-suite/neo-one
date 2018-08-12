import { ABIReturn } from '@neo-one/client';
import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { isOnlyArray, isOnlyBoolean, isOnlyBuffer, isOnlyString } from '../compile/helper/types';
import { Context } from '../Context';
import { getFixedDecimals } from './getFixedDecimals';

export function toABIReturn(context: Context, node: ts.Node, type: ts.Type | undefined): ABIReturn | undefined {
  let resolvedType = type;
  if (resolvedType === undefined) {
    return undefined;
  }

  let optional = false;
  if (tsUtils.type_.hasUndefinedish(resolvedType)) {
    resolvedType = tsUtils.type_.getNonNullableType(resolvedType);
    optional = true;
  }

  if (isOnlyBoolean(context, node, resolvedType)) {
    return { type: 'Boolean', optional };
  }

  if (context.builtins.isInterface(node, resolvedType, 'Address')) {
    return { type: 'Hash160', optional };
  }

  if (context.builtins.isInterface(node, resolvedType, 'Hash256')) {
    return { type: 'Hash256', optional };
  }

  if (context.builtins.isInterface(node, resolvedType, 'PublicKey')) {
    return { type: 'PublicKey', optional };
  }

  if (tsUtils.type_.isOnlyVoidish(resolvedType)) {
    return { type: 'Void', optional };
  }

  if (isOnlyString(context, node, resolvedType)) {
    return { type: 'String', optional };
  }

  if (tsUtils.type_.isOnlyNumberLiteral(resolvedType)) {
    return { type: 'Integer', optional, decimals: 0 };
  }

  if (context.builtins.isType(node, resolvedType, 'Fixed')) {
    const decimals = getFixedDecimals(resolvedType);

    return { type: 'Integer', optional, decimals };
  }

  if (tsUtils.type_.isOnlyNumberish(resolvedType)) {
    return { type: 'Integer', optional, decimals: 0 };
  }

  if (isOnlyArray(context, node, resolvedType)) {
    const typeArguments = tsUtils.type_.getTypeArguments(resolvedType);
    if (typeArguments !== undefined) {
      const value = toABIReturn(context, node, typeArguments[0]);
      if (value !== undefined) {
        return { type: 'Array', optional, value };
      }
    }
  }

  if (isOnlyBuffer(context, node, resolvedType)) {
    return { type: 'ByteArray', optional };
  }

  return undefined;
}
