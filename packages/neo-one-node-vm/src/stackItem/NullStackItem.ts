import { BinaryWriter } from '@neo-one/client-common';
import { InvalidValueBufferError } from './errors';
import { StackItemBase } from './StackItemBase';
import { StackItemType } from './StackItemType';

export class NullStackItem extends StackItemBase {
  public constructor() {
    super();
  }

  // tslint:disable-next-line: no-any
  public equals(other: any): boolean {
    if (this === other) {
      return true;
    }

    if (other instanceof NullStackItem) {
      return true;
    }

    if (other === undefined) {
      return true;
    }

    return false;
  }

  public isNull(): boolean {
    return true;
  }

  public asBoolean(): boolean {
    return false;
  }

  public asBuffer(): Buffer {
    throw new InvalidValueBufferError();
  }

  protected serializeInternal(): Buffer {
    const writer = new BinaryWriter();
    writer.writeUInt8(StackItemType.Null);

    return writer.toBuffer();
  }
}
