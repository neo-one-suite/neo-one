import { BinaryWriter, createSerializeWire, IOHelper, SerializeWire, VMState } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableWire } from './Serializable';
import { Transaction } from './transaction';
import { BinaryReader, utils } from './utils';

export interface TransactionStateAdd {
  readonly blockIndex: number;
  readonly vmState: VMState;
  readonly transaction: Transaction;
}

export class TransactionState implements SerializableWire<TransactionState> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions) {
    const { reader } = options;
    const blockIndex = reader.readUInt32LE();
    const vmState = reader.readUInt8();
    const transaction = Transaction.deserializeWireBase(options);

    return new this({
      blockIndex,
      vmState,
      transaction,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions) {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly blockIndex: number;
  public readonly vmState: VMState;
  public readonly transaction: Transaction;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal: () => number;

  public constructor({ blockIndex, vmState, transaction }: TransactionStateAdd) {
    this.blockIndex = blockIndex;
    this.vmState = vmState;
    this.transaction = transaction;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfUInt32LE + IOHelper.sizeOfUInt8 + this.transaction.size);
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public clone(): TransactionState {
    return new TransactionState({
      blockIndex: this.blockIndex,
      vmState: this.vmState,
      transaction: this.transaction,
    });
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeUInt32LE(this.blockIndex);
    writer.writeUInt8(this.vmState);
    this.transaction.serializeWireBase(writer);
  }
}
