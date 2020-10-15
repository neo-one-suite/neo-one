import { createSerializeWire, IOHelper, Nep5BalanceKeyModel, UInt160 } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from './Serializable';
import { BinaryReader, utils } from './utils';

export interface Nep5BalanceKeyAdd {
  readonly userScriptHash: UInt160;
  readonly assetScriptHash: UInt160;
}

export class Nep5BalanceKey extends Nep5BalanceKeyModel {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Nep5BalanceKey {
    const { reader } = options;
    const userScriptHash = reader.readUInt160();
    const assetScriptHash = reader.readUInt160();

    return new this({
      userScriptHash,
      assetScriptHash,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): Nep5BalanceKey {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal = utils.lazy(() => IOHelper.sizeOfUInt160 + IOHelper.sizeOfUInt160);

  public get size() {
    return this.sizeInternal();
  }

  public clone() {
    return new Nep5BalanceKey({
      userScriptHash: this.userScriptHash,
      assetScriptHash: this.assetScriptHash,
    });
  }
}
