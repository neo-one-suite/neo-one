import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';

export function getForwardedValueType(type: ts.Type): ts.Type | undefined {
  const aliasTypes = tsUtils.type_.getAliasTypeArgumentsArray(type);
  if (aliasTypes.length === 1) {
    return aliasTypes[0];
  }

  return undefined;
}
