import { CustomError } from '@neo-one/utils';

export enum InventoryType {
  Transaction = 0x01,
  Block = 0x02,
  Consensus = 0xe0,
}

export class InvalidInventoryTypeError extends CustomError {
  public readonly inventoryType: number;
  public readonly code: string;

  public constructor(inventoryType: number) {
    super(`Expected inventory type, found: ${inventoryType}`);
    this.inventoryType = inventoryType;
    this.code = 'INVALID_INVENTORY_TYPE';
  }
}

const isInventoryType = (inventoryType: number): inventoryType is InventoryType =>
  // tslint:disable-next-line strict-type-predicates
  InventoryType[inventoryType] !== undefined;

export const assertInventoryType = (inventoryType: number): InventoryType => {
  if (isInventoryType(inventoryType)) {
    return inventoryType;
  }

  throw new InvalidInventoryTypeError(inventoryType);
};
