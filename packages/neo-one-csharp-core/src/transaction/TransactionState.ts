import { IOHelper, TransactionStateModel } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from '../Serializable';
import { BinaryReader, utils } from '../utils';
import { Transaction } from './Transaction';

export class TransactionState extends TransactionStateModel<Transaction> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): TransactionState {
    const { reader } = options;
    const blockIndex = reader.readUInt32LE();
    const state = reader.readUInt8();
    const transaction = Transaction.deserializeWireBase(options);

    return new this({
      blockIndex,
      state,
      transaction,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): TransactionState {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  private readonly sizeInternal = utils.lazy(
    () => IOHelper.sizeOfUInt32LE + IOHelper.sizeOfUInt8 + this.transaction.size,
  );

  public get size() {
    return this.sizeInternal();
  }
}
