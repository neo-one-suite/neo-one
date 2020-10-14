import { createSerializeWire, IOHelper, Nep5TransferModel, UInt160, UInt256 } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from './Serializable';
import { BinaryReader, utils } from './utils';

export interface Nep5TransferAdd {
  readonly userScriptHash: UInt160;
  readonly blockIndex: number;
  readonly txHash: UInt256;
  readonly amountBuffer: Buffer;
}

export class Nep5Transfer extends Nep5TransferModel {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Nep5Transfer {
    const { reader } = options;
    const userScriptHash = reader.readUInt160();
    const blockIndex = reader.readUInt32LE();
    const txHash = reader.readUInt256();
    const amountBuffer = reader.readVarBytesLE(512);

    return new this({
      userScriptHash,
      blockIndex,
      txHash,
      amountBuffer,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): Nep5Transfer {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal = utils.lazy(
    () =>
      IOHelper.sizeOfUInt160 +
      IOHelper.sizeOfUInt32LE +
      IOHelper.sizeOfUInt256 +
      IOHelper.sizeOfVarBytesLE(this.amountInternal),
  );

  public get amount() {
    return new BN(this.amountInternal);
  }

  public get size() {
    return this.sizeInternal();
  }

  public clone() {
    return new Nep5Transfer({
      userScriptHash: this.userScriptHash,
      blockIndex: this.blockIndex,
      txHash: this.txHash,
      amountBuffer: this.amountInternal,
    });
  }
}
