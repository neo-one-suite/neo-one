import { BinaryWriter, BooleanContractParameter, ContractParameter, utils } from '@neo-one/client-core';
import BN from 'bn.js';
import { StackItemBase } from './StackItemBase';
import { StackItemType } from './StackItemType';

export class BooleanStackItem extends StackItemBase {
  public static readonly TRUE = Buffer.from([1]);
  public static readonly FALSE = Buffer.from([0]);
  public readonly value: boolean;

  public constructor(value: boolean) {
    super();
    this.value = value;
  }

  // tslint:disable-next-line no-any
  public equals(other: any): boolean {
    if (other === undefined) {
      return false;
    }

    if (this === other) {
      return true;
    }

    if (other instanceof BooleanStackItem) {
      return this.value === other.value;
    }

    if (other instanceof StackItemBase) {
      const value = other.asBufferMaybe();

      return value !== undefined && this.asBuffer().equals(value);
    }

    return false;
  }

  public serialize(): Buffer {
    const writer = new BinaryWriter();
    writer.writeUInt8(StackItemType.Boolean);
    writer.writeBoolean(this.value);

    return writer.toBuffer();
  }

  public asBigInteger(): BN {
    return this.value ? utils.ONE : utils.ZERO;
  }

  public asBoolean(): boolean {
    return this.value;
  }

  public asBuffer(): Buffer {
    return this.value ? BooleanStackItem.TRUE : BooleanStackItem.FALSE;
  }

  public toContractParameter(): ContractParameter {
    return new BooleanContractParameter(this.value);
  }
}
