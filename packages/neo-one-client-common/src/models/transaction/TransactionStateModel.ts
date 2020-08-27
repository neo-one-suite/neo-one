import { BinaryWriter } from '../../BinaryWriter';
import { createSerializeWire, SerializableWire } from '../Serializable';
import { VMState } from '../vm';
import { TransactionModel } from './TransactionModel';

export interface TransactionStateModelAdd<TTransactionModel extends TransactionModel = TransactionModel> {
  readonly blockIndex: number;
  readonly state: VMState;
  readonly transaction: TTransactionModel;
}

export class TransactionStateModel<TTransactionModel extends TransactionModel = TransactionModel>
  implements SerializableWire {
  public readonly blockIndex: number;
  public readonly state: VMState;
  public readonly transaction: TTransactionModel;
  public readonly serializeWire = createSerializeWire(this.serializeWireBase);

  public constructor(options: TransactionStateModelAdd<TTransactionModel>) {
    this.blockIndex = options.blockIndex;
    this.state = options.state;
    this.transaction = options.transaction;
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeUInt32LE(this.blockIndex);
    writer.writeUInt8(this.state);
    this.transaction.serializeWireBase(writer);
  }
}
