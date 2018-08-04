import { ABIReturn } from '@neo-one/client';
import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../Context';
import { getFixedDecimals } from './getFixedDecimals';
import { isFixedType } from './isFixedType';

const BYTE_ARRAY_RETURN: ABIReturn = { type: 'ByteArray' };

export function toABIReturn(
  context: Context,
  node: ts.Node,
  resolvedType: ts.Type | undefined,
  typeIdentifier?: ts.Identifier,
): ABIReturn | undefined {
  if (resolvedType === undefined && typeIdentifier === undefined) {
    return undefined;
  }

  if (resolvedType !== undefined && tsUtils.type_.isOnlyBooleanish(resolvedType)) {
    return { type: 'Boolean' };
  }

  if (context.isLibAlias(typeIdentifier, 'Address')) {
    return { type: 'Hash160' };
  }

  if (context.isLibAlias(typeIdentifier, 'Hash256')) {
    return { type: 'Hash256' };
  }

  if (context.isLibAlias(typeIdentifier, 'Signature')) {
    return { type: 'Signature' };
  }

  if (context.isLibAlias(typeIdentifier, 'PublicKey')) {
    return { type: 'PublicKey' };
  }

  if (resolvedType === undefined) {
    return undefined;
  }

  if (tsUtils.type_.isOnlyVoidish(resolvedType)) {
    return { type: 'Void' };
  }

  if (tsUtils.type_.isOnlyStringish(resolvedType)) {
    return { type: 'String' };
  }

  if (tsUtils.type_.isOnlyNumberLiteral(resolvedType)) {
    return { type: 'Integer', decimals: 0 };
  }

  if (isFixedType(context, node, resolvedType)) {
    const decimals = getFixedDecimals(resolvedType);

    return { type: 'Integer', decimals };
  }

  if (tsUtils.type_.isOnlyNumberish(resolvedType)) {
    return { type: 'Integer', decimals: 0 };
  }

  if (tsUtils.type_.isOnlyArray(resolvedType)) {
    const typeArguments = tsUtils.type_.getTypeArguments(resolvedType);
    if (typeArguments !== undefined) {
      const value = toABIReturn(context, node, typeArguments[0]);
      if (value !== undefined) {
        return { type: 'Array', value };
      }
    }
  }

  if (context.isOnlyGlobal(node, resolvedType, 'Buffer')) {
    return BYTE_ARRAY_RETURN;
  }

  return undefined;
}
