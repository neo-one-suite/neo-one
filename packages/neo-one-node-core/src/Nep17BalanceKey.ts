import { createSerializeWire, IOHelper, Nep17BalanceKeyModel, UInt160 } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from './Serializable';
import { BinaryReader, utils } from './utils';

export interface Nep17BalanceKeyAdd {
  readonly userScriptHash: UInt160;
  readonly assetScriptHash: UInt160;
}

export class Nep17BalanceKey extends Nep17BalanceKeyModel {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Nep17BalanceKey {
    const { reader } = options;
    const userScriptHash = reader.readUInt160();
    const assetScriptHash = reader.readUInt160();

    return new this({
      userScriptHash,
      assetScriptHash,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): Nep17BalanceKey {
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
    return new Nep17BalanceKey({
      userScriptHash: this.userScriptHash,
      assetScriptHash: this.assetScriptHash,
    });
  }
}
