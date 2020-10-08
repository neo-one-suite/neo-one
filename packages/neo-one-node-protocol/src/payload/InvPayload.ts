import { BinaryWriter, createSerializeWire, SerializableWire, SerializeWire, UInt256 } from '@neo-one/client-common';
import { BinaryReader, DeserializeWireBaseOptions, DeserializeWireOptions } from '@neo-one/node-core';
import { range } from 'lodash';
import { assertInventoryType, InventoryType } from './InventoryType';
export interface InvPayloadAdd {
  readonly type: InventoryType;
  readonly hashes: readonly UInt256[];
}

export const maxHashesCount = 500;

export class InvPayload implements SerializableWire {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): InvPayload {
    const type = assertInventoryType(reader.readUInt8());
    const hashes = reader.readArray(() => reader.readUInt256());

    return new this({ type, hashes });
  }

  public static deserializeWire(options: DeserializeWireOptions): InvPayload {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public static createGroup(type: InventoryType, hashes: readonly UInt256[]) {
    return range(0, hashes.length, maxHashesCount).map((idx) => {
      const newEndIndex = idx + maxHashesCount;
      const endIndex = newEndIndex > hashes.length ? hashes.length : newEndIndex;

      return new InvPayload({
        type,
        hashes: hashes.slice(idx, endIndex),
      });
    });
  }

  public readonly type: InventoryType;
  public readonly hashes: readonly UInt256[];
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ type, hashes }: InvPayloadAdd) {
    this.type = type;
    this.hashes = hashes;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeArray(this.hashes, (value) => {
      writer.writeUInt256(value);
    });
  }
}
