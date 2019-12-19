import { ContractStateJSON, crypto, IOHelper, JSONHelper, UInt160 } from '@neo-one/client-common';
import { ContractStateModel, ContractStateModelAdd, HasPayable, HasStorage } from '@neo-one/client-full-common';
import { ContractManifest } from './contract';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableJSON } from './Serializable';
import { BinaryReader, utils } from './utils';

export type ContractStateAdd = ContractStateModelAdd<ContractManifest>;

export class ContractState extends ContractStateModel<ContractManifest> implements SerializableJSON<ContractStateJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractState {
    const { reader } = options;
    const script = reader.readVarBytesLE();
    const manifest = ContractManifest.deserializeWireBase(options);

    return new this({
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

  private readonly sizeInternal = utils.lazy(
    () =>
      IOHelper.sizeOfVarBytesLE(this.script) + IOHelper.sizeOfVarString(JSON.stringify(this.manifest.serializeJSON())),
  );
  private readonly scriptHashInternal = utils.lazy(() => crypto.hash160(this.script));

  public get size(): number {
    return this.sizeInternal();
  }

  public get scriptHash(): UInt160 {
    return this.scriptHashInternal();
  }

  public hasStorage(): boolean {
    return HasStorage.has(this.manifest.features);
  }

  public hasPayable(): boolean {
    return HasPayable.has(this.manifest.features);
  }

  public clone(): ContractState {
    return new ContractState({
      script: this.script,
      manifest: this.manifest.clone(),
    });
  }

  public serializeJSON(): ContractStateJSON {
    return {
      hash: JSONHelper.writeUInt160(this.scriptHash),
      script: JSONHelper.writeBuffer(this.script),
      manifest: this.manifest.serializeJSON(),
    };
  }
}
