import { BinaryReader, createSerializeWire, IOHelper, Nep17TransferKeyModel, UInt160 } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from './Serializable';
import { utils } from './utils';

export interface Nep17TransferKeyAdd {
  readonly userScriptHash: UInt160;
  readonly timestampMS: BN;
  readonly assetScriptHash: UInt160;
  readonly blockTransferNotificationIndex: number;
}

export class Nep17TransferKey extends Nep17TransferKeyModel {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Nep17TransferKey {
    const { reader } = options;
    const userScriptHash = reader.readUInt160();
    const timestampMS = reader.readUInt64LE();
    const assetScriptHash = reader.readUInt160();
    const blockTransferNotificationIndex = reader.readUInt16LE();

    return new this({
      userScriptHash,
      timestampMS,
      assetScriptHash,
      blockTransferNotificationIndex,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): Nep17TransferKey {
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
    return new Nep17TransferKey({
      userScriptHash: this.userScriptHash,
      timestampMS: this.timestampMS,
      assetScriptHash: this.assetScriptHash,
      blockTransferNotificationIndex: this.blockTransferNotificationIndex,
    });
  }
}
