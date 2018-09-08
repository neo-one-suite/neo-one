import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';

export function getFixedDecimals(type: ts.Type): number | undefined {
  const aliasTypes = tsUtils.type_.getAliasTypeArgumentsArray(type);
  if (aliasTypes.length === 1) {
    // tslint:disable-next-line no-any
    return (aliasTypes[0] as any).value;
  }

  return undefined;
}
