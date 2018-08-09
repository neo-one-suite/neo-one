import { ABIReturn } from '@neo-one/client';
import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { isOnlyArray, isOnlyBoolean, isOnlyBuffer, isOnlyString } from '../compile/helper/types';
import { Context } from '../Context';
import { getFixedDecimals } from './getFixedDecimals';

const BYTE_ARRAY_RETURN: ABIReturn = { type: 'ByteArray' };

export function toABIReturn(context: Context, node: ts.Node, type: ts.Type | undefined): ABIReturn | undefined {
  let resolvedType = type;
  if (resolvedType !== undefined && tsUtils.type_.hasUndefinedish(resolvedType)) {
    resolvedType = tsUtils.type_.getNonNullableType(resolvedType);
  }

  if (resolvedType === undefined) {
    return undefined;
  }

  if (isOnlyBoolean(context, node, resolvedType)) {
    return { type: 'Boolean' };
  }

  if (context.builtins.isInterface(node, resolvedType, 'Address')) {
    return { type: 'Hash160' };
  }

  if (context.builtins.isInterface(node, resolvedType, 'Hash256')) {
    return { type: 'Hash256' };
  }

  if (context.builtins.isInterface(node, resolvedType, 'PublicKey')) {
    return { type: 'PublicKey' };
  }

  if (tsUtils.type_.isOnlyVoidish(resolvedType)) {
    return { type: 'Void' };
  }

  if (isOnlyString(context, node, resolvedType)) {
    return { type: 'String' };
  }

  if (tsUtils.type_.isOnlyNumberLiteral(resolvedType)) {
    return { type: 'Integer', decimals: 0 };
  }

  if (context.builtins.isType(node, resolvedType, 'Fixed')) {
    const decimals = getFixedDecimals(resolvedType);

    return { type: 'Integer', decimals };
  }

  if (tsUtils.type_.isOnlyNumberish(resolvedType)) {
    return { type: 'Integer', decimals: 0 };
  }

  if (isOnlyArray(context, node, resolvedType)) {
    const typeArguments = tsUtils.type_.getTypeArguments(resolvedType);
    if (typeArguments !== undefined) {
      const value = toABIReturn(context, node, typeArguments[0]);
      if (value !== undefined) {
        return { type: 'Array', value };
      }
    }
  }

  if (isOnlyBuffer(context, node, resolvedType)) {
    return BYTE_ARRAY_RETURN;
  }

  return undefined;
}
