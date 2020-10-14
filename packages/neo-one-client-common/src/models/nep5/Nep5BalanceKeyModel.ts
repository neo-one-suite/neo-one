import { BinaryWriter } from '../../BinaryWriter';
import { UInt160 } from '../../common';
import { createSerializeWire, SerializableWire, SerializeWire } from '../Serializable';

export interface Nep5BalanceKeyModelAdd {
  readonly userScriptHash: UInt160;
  readonly assetScriptHash: UInt160;
}

export class Nep5BalanceKeyModel implements SerializableWire {
  public readonly userScriptHash: UInt160;
  public readonly assetScriptHash: UInt160;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ userScriptHash, assetScriptHash }: Nep5BalanceKeyModelAdd) {
    this.userScriptHash = userScriptHash;
    this.assetScriptHash = assetScriptHash;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarBytesLE(this.userScriptHash);
    writer.writeVarBytesLE(this.assetScriptHash);
  }
}
