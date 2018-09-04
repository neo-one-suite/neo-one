import { utils } from '@neo-one/utils';
import { Types, WrappableType } from './Types';

export enum StructuredStorageType {
  ArrayStorage = 'ArrayStorage',
  MapStorage = 'MapStorage',
  SetStorage = 'SetStorage',
}

export const STRUCTURED_STORAGE_TYPES: ReadonlyArray<StructuredStorageType> = [
  ...new Set(Object.values(StructuredStorageType)),
];

export const getTypeFromStructuredStorageType = (structuredStorageType: StructuredStorageType): WrappableType => {
  switch (structuredStorageType) {
    case StructuredStorageType.ArrayStorage:
      return Types.ArrayStorage;
    case StructuredStorageType.SetStorage:
      return Types.SetStorage;
    case StructuredStorageType.MapStorage:
      return Types.MapStorage;
    default:
      utils.assertNever(structuredStorageType);
      throw new Error('For TS');
  }
};
