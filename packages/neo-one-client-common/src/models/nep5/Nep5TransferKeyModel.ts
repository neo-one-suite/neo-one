import { BN } from 'bn.js';
import { BinaryWriter } from '../../BinaryWriter';
import { UInt160 } from '../../common';
import { createSerializeWire, SerializableWire, SerializeWire } from '../Serializable';

export interface Nep5TransferKeyModelAdd {
  readonly userScriptHash: UInt160;
  readonly timestampMS: BN;
  readonly assetScriptHash: UInt160;
  readonly blockXferNotificationIndex: number;
}

export class Nep5TransferKeyModel implements SerializableWire {
  public readonly userScriptHash: UInt160;
  public readonly timestampMS: BN;
  public readonly assetScriptHash: UInt160;
  public readonly blockXferNotificationIndex: number;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({
    userScriptHash,
    timestampMS,
    assetScriptHash,
    blockXferNotificationIndex,
  }: Nep5TransferKeyModelAdd) {
    this.userScriptHash = userScriptHash;
    this.timestampMS = timestampMS;
    this.assetScriptHash = assetScriptHash;
    this.blockXferNotificationIndex = blockXferNotificationIndex;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarBytesLE(this.userScriptHash);
    writer.writeUInt64LE(this.timestampMS);
    writer.writeVarBytesLE(this.assetScriptHash);
    writer.writeUInt32LE(this.blockXferNotificationIndex);
  }
}
