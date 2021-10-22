import {
  BinaryReader,
  BinaryWriter,
  FailedTransactionJSON,
  IOHelper,
  JSONHelper,
  UInt256,
} from '@neo-one/client-common';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
  SerializeWire,
} from '../Serializable';
import { utils } from '../utils';

export interface FailedTransactionAdd {
  readonly hash: UInt256;
  readonly blockIndex: number;
  readonly message: string;
}

export interface FailedTransactionKey {
  readonly hash: UInt256;
}

const MAX_SIZE = 1024;

export class FailedTransaction implements SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): FailedTransaction {
    const { reader } = options;
    const hash = reader.readUInt256();
    const blockIndex = reader.readUInt32LE();
    const message = reader.readVarString(MAX_SIZE);

    return new this({
      hash,
      blockIndex,
      message,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): FailedTransaction {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly hash: UInt256;
  public readonly blockIndex: number;
  public readonly message: string;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal: () => number;

  public constructor({ hash, blockIndex, message }: FailedTransactionAdd) {
    this.hash = hash;
    this.blockIndex = blockIndex;
    this.message = message;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfUInt256 + IOHelper.sizeOfUInt32LE + IOHelper.sizeOfUInt64LE);
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt256(this.hash);
    writer.writeUInt32LE(this.blockIndex);
    writer.writeVarString(this.message, MAX_SIZE);
  }

  public serializeJSON(): FailedTransactionJSON {
    return {
      hash: JSONHelper.writeUInt256(this.hash),
      blockIndex: this.blockIndex,
      message: this.message,
    };
  }
}
