import { BN } from 'bn.js';
import { BinaryWriter } from '../../BinaryWriter';
import { UInt160 } from '../../common';
import { createSerializeWire, SerializableWire, SerializeWire } from '../Serializable';

export interface Nep17TransferKeyModelAdd {
  readonly userScriptHash: UInt160;
  readonly timestampMS: BN;
  readonly assetScriptHash: UInt160;
  readonly blockTransferNotificationIndex: number;
}

export class Nep17TransferKeyModel implements SerializableWire {
  public readonly userScriptHash: UInt160;
  public readonly timestampMS: BN;
  public readonly assetScriptHash: UInt160;
  public readonly blockTransferNotificationIndex: number;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({
    userScriptHash,
    timestampMS,
    assetScriptHash,
    blockTransferNotificationIndex,
  }: Nep17TransferKeyModelAdd) {
    this.userScriptHash = userScriptHash;
    this.timestampMS = timestampMS;
    this.assetScriptHash = assetScriptHash;
    this.blockTransferNotificationIndex = blockTransferNotificationIndex;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt160(this.userScriptHash);
    writer.writeUInt64LE(this.timestampMS);
    writer.writeUInt160(this.assetScriptHash);
    writer.writeUInt32LE(this.blockTransferNotificationIndex);
  }
}
