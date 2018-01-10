/* @flow */
import { CustomError } from '@neo-one/utils';

export const INVENTORY_TYPE = {
  TRANSACTION: 0x01,
  BLOCK: 0x02,
  CONSENSUS: 0xe0,
};
export type InventoryType = 0x01 | 0x02 | 0xe0;

export class InvalidInventoryTypeError extends CustomError {
  inventoryType: number;
  code: string;

  constructor(inventoryType: number) {
    super(`Expected inventory type, found: ${inventoryType}`);
    this.inventoryType = inventoryType;
    this.code = 'INVALID_INVENTORY_TYPE';
  }
}

export const assertInventoryType = (inventoryType: number): InventoryType => {
  switch (inventoryType) {
    case INVENTORY_TYPE.TRANSACTION:
      return INVENTORY_TYPE.TRANSACTION;
    case INVENTORY_TYPE.BLOCK:
      return INVENTORY_TYPE.BLOCK;
    case INVENTORY_TYPE.CONSENSUS:
      return INVENTORY_TYPE.CONSENSUS;
    default:
      throw new InvalidInventoryTypeError(inventoryType);
  }
};
