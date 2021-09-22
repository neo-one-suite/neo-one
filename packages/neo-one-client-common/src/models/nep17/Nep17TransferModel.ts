import { BinaryWriter } from '../../BinaryWriter';
import { UInt160, UInt256 } from '../../common';
import { createSerializeWire, SerializableWire, SerializeWire } from '../Serializable';
import { VMState } from '../vm';

export enum Nep17TransferSource {
  All = 0xff,
  Transaction = 0x00,
  Block = 0x01,
}

export interface Nep17TransferModelAdd {
  readonly userScriptHash: UInt160;
  readonly blockIndex: number;
  readonly txHash: UInt256;
  readonly amountBuffer: Buffer;
  readonly source: 'Block' | 'Transaction';
  readonly state: VMState;
}

export class Nep17TransferModel implements SerializableWire {
  public readonly userScriptHash: UInt160;
  public readonly blockIndex: number;
  public readonly txHash: UInt256;
  public readonly amountInternal: Buffer;
  public readonly source: Nep17TransferSource;
  public readonly state: VMState;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ userScriptHash, blockIndex, txHash, amountBuffer, source, state }: Nep17TransferModelAdd) {
    this.userScriptHash = userScriptHash;
    this.blockIndex = blockIndex;
    this.txHash = txHash;
    this.amountInternal = amountBuffer;
    this.source = source === 'Block' ? Nep17TransferSource.Block : Nep17TransferSource.Transaction;
    this.state = state;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt160(this.userScriptHash);
    writer.writeUInt32LE(this.blockIndex);
    writer.writeUInt256(this.txHash);
    writer.writeVarBytesLE(this.amountInternal);
    writer.writeUInt8(this.source);
    writer.writeUInt8(this.state);
  }
}
