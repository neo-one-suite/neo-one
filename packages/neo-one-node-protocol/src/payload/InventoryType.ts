import { makeErrorWithCode } from '@neo-one/utils';

export enum InventoryType {
  Transaction = 0x01,
  Block = 0x02,
  Consensus = 0xe0,
}

export const InvalidInventoryTypeError = makeErrorWithCode(
  'INVALID_INVENTORY_TYPE',
  (inventoryType: number) => `Expected inventory type, found: ${inventoryType}`,
);

const isInventoryType = (inventoryType: number): inventoryType is InventoryType =>
  // tslint:disable-next-line strict-type-predicates
  InventoryType[inventoryType] !== undefined;

export const assertInventoryType = (inventoryType: number): InventoryType => {
  if (isInventoryType(inventoryType)) {
    return inventoryType;
  }

  throw new InvalidInventoryTypeError(inventoryType);
};
