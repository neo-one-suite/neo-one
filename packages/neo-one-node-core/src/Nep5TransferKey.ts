import { createSerializeWire, IOHelper, Nep5TransferKeyModel, UInt160 } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from './Serializable';
import { BinaryReader, utils } from './utils';

export interface Nep5TransferKeyAdd {
  readonly userScriptHash: UInt160;
  readonly timestampMS: BN;
  readonly assetScriptHash: UInt160;
  readonly blockXferNotificationIndex: number;
}

export class Nep5TransferKey extends Nep5TransferKeyModel {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Nep5TransferKey {
    const { reader } = options;
    const userScriptHash = reader.readUInt160();
    const timestampMS = reader.readUInt64LE();
    const assetScriptHash = reader.readUInt160();
    const blockXferNotificationIndex = reader.readUInt16LE();

    return new this({
      userScriptHash,
      timestampMS,
      assetScriptHash,
      blockXferNotificationIndex,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): Nep5TransferKey {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal = utils.lazy(
    () => IOHelper.sizeOfUInt160 + IOHelper.sizeOfUInt64LE + IOHelper.sizeOfUInt64LE + IOHelper.sizeOfUInt16LE,
  );

  public get size() {
    return this.sizeInternal();
  }

  public clone() {
    return new Nep5TransferKey({
      userScriptHash: this.userScriptHash,
      timestampMS: this.timestampMS,
      assetScriptHash: this.assetScriptHash,
      blockXferNotificationIndex: this.blockXferNotificationIndex,
    });
  }
}
