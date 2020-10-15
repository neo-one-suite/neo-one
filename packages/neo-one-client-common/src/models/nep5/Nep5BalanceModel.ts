import { BinaryWriter } from '../../BinaryWriter';
import { createSerializeWire, SerializableWire, SerializeWire } from '../Serializable';

export interface Nep5BalanceModelAdd {
  readonly balanceBuffer: Buffer;
  readonly lastUpdatedBlock: number;
}

export class Nep5BalanceModel implements SerializableWire {
  public readonly balanceInternal: Buffer;
  public readonly lastUpdatedBlock: number;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ balanceBuffer, lastUpdatedBlock }: Nep5BalanceModelAdd) {
    this.balanceInternal = balanceBuffer;
    this.lastUpdatedBlock = lastUpdatedBlock;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarBytesLE(this.balanceInternal);
    writer.writeUInt32LE(this.lastUpdatedBlock);
  }
}
