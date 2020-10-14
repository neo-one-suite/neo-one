import { createSerializeWire, IOHelper, Nep5BalanceModel } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from './Serializable';
import { BinaryReader, utils } from './utils';

export interface Nep5BalanceAdd {
  readonly balanceBuffer: Buffer;
  readonly lastUpdatedBlock: number;
}

export class Nep5Balance extends Nep5BalanceModel {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Nep5Balance {
    const { reader } = options;
    const balanceBuffer = reader.readVarBytesLE(512);
    const lastUpdatedBlock = reader.readUInt32LE();

    return new this({
      balanceBuffer,
      lastUpdatedBlock,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): Nep5Balance {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal = utils.lazy(
    () => IOHelper.sizeOfVarBytesLE(this.balanceInternal) + IOHelper.sizeOfUInt32LE,
  );

  public get balance() {
    return new BN(this.balanceInternal);
  }

  public get size() {
    return this.sizeInternal();
  }

  public clone() {
    return new Nep5Balance({
      balanceBuffer: this.balanceInternal,
      lastUpdatedBlock: this.lastUpdatedBlock,
    });
  }
}
