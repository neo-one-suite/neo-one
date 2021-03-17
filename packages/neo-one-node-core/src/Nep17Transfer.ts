import {
  BinaryReader,
  createSerializeWire,
  IOHelper,
  Nep17TransferModel,
  UInt160,
  UInt256,
} from '@neo-one/client-common';
import { BN } from 'bn.js';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from './Serializable';
import { utils } from './utils';

export interface Nep17TransferAdd {
  readonly userScriptHash: UInt160;
  readonly blockIndex: number;
  readonly txHash: UInt256;
  readonly amountBuffer: Buffer;
}

export class Nep17Transfer extends Nep17TransferModel {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Nep17Transfer {
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

  public static deserializeWire(options: DeserializeWireOptions): Nep17Transfer {
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
}
