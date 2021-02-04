import { BinaryWriter } from '../../BinaryWriter';
import { UInt160, UInt256 } from '../../common';
import { createSerializeWire, SerializableWire, SerializeWire } from '../Serializable';

export interface Nep17TransferModelAdd {
  readonly userScriptHash: UInt160;
  readonly blockIndex: number;
  readonly txHash: UInt256;
  readonly amountBuffer: Buffer;
}

export class Nep17TransferModel implements SerializableWire {
  public readonly userScriptHash: UInt160;
  public readonly blockIndex: number;
  public readonly txHash: UInt256;
  public readonly amountInternal: Buffer;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ userScriptHash, blockIndex, txHash, amountBuffer }: Nep17TransferModelAdd) {
    this.userScriptHash = userScriptHash;
    this.blockIndex = blockIndex;
    this.txHash = txHash;
    this.amountInternal = amountBuffer;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt160(this.userScriptHash);
    writer.writeUInt32LE(this.blockIndex);
    writer.writeUInt256(this.txHash);
    writer.writeVarBytesLE(this.amountInternal);
  }
}
