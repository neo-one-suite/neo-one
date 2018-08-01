import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';

export function getFixedDecimals(type: ts.Type): number {
  const unionTypes = tsUtils.type_.getUnionTypes(type);
  if (unionTypes !== undefined && unionTypes.length === 2) {
    const intersectionTypes = tsUtils.type_.getIntersectionTypes(unionTypes[1]);
    if (intersectionTypes !== undefined && intersectionTypes.length === 2) {
      const typeArguments = tsUtils.type_.getTypeArguments(intersectionTypes[1]);
      if (typeArguments !== undefined && typeArguments.length === 1) {
        // tslint:disable-next-line no-any
        return (typeArguments[0] as any).value;
      }
    }
  }

  throw new Error('Something went wrong');
}
