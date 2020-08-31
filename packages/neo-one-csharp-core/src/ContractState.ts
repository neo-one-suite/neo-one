import { common, createSerializeWire, crypto, IOHelper, UInt160 } from '@neo-one/client-common';
import { ContractStateModel } from '@neo-one/client-full-common';
import { ContractManifest } from './manifest';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from './Serializable';
import { BinaryReader, utils } from './utils';

export interface ContractStateAdd {
  readonly id: number;
  readonly script: Buffer;
  readonly manifest: ContractManifest;
}

export type ContractKey = UInt160;

export class ContractState extends ContractStateModel<ContractManifest> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractState {
    const { reader } = options;
    const id = reader.readUInt32LE();
    const script = reader.readVarBytesLE();
    const manifest = ContractManifest.deserializeWireBase(options);

    return new this({
      id,
      script,
      manifest,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractState {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  private readonly scriptHashInternal = utils.lazy(() => common.asUInt160(crypto.hash160(this.script)));
  private readonly sizeInternal = utils.lazy(
    () => IOHelper.sizeOfUInt32LE + IOHelper.sizeOfVarBytesLE(this.script) + this.manifest.size,
  );

  public get scriptHash() {
    return this.scriptHashInternal();
  }

  public get size() {
    return this.sizeInternal();
  }

  public clone() {
    return new ContractState({
      id: this.id,
      script: this.script,
      manifest: this.manifest,
    });
  }
}
