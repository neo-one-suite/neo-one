import { makeErrorWithCode } from '@neo-one/utils';

export enum InventoryType {
  TX = 0x2b, // Command.TX
  Block = 0x2c, // Command.Block
  Extensible = 0x2e, // Command.Extensible
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
