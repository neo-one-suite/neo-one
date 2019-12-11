import { BinaryWriter } from '@neo-one/client-common';
import { UnsupportedStackItemSerdeError } from './errors';
import { StackItemBase } from './StackItemBase';

export class StringStackItem extends StackItemBase {
  public readonly value: string;

  public constructor(value: string) {
    super();
    this.value = value;
  }

  // tslint:disable-next-line: no-any
  public equals(other: any): boolean {
    if (this === other) {
      return true;
    }

    if (other instanceof StringStackItem) {
      return this.value === other.value;
    }

    return false;
  }

  public asBoolean(): boolean {
    return false;
  }

  public asString(): string {
    return this.value;
  }

  public asBuffer(): Buffer {
    const writer = new BinaryWriter();
    // might need to include a max here
    writer.writeVarString(this.value);

    return writer.toBuffer();
  }

  protected serializeInternal(): Buffer {
    throw new UnsupportedStackItemSerdeError();
  }
}
