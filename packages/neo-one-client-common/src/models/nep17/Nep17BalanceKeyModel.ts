import { BinaryWriter } from '../../BinaryWriter';
import { UInt160 } from '../../common';
import { createSerializeWire, SerializableWire, SerializeWire } from '../Serializable';

export interface Nep17BalanceKeyModelAdd {
  readonly userScriptHash: UInt160;
  readonly assetScriptHash: UInt160;
}

export class Nep17BalanceKeyModel implements SerializableWire {
  public readonly userScriptHash: UInt160;
  public readonly assetScriptHash: UInt160;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ userScriptHash, assetScriptHash }: Nep17BalanceKeyModelAdd) {
    this.userScriptHash = userScriptHash;
    this.assetScriptHash = assetScriptHash;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt160(this.userScriptHash);
    writer.writeUInt160(this.assetScriptHash);
  }
}
