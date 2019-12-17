import { BinaryWriter, createSerializeWire, SerializableWire, SerializeWire } from '@neo-one/client-common';
import { ContractManifestModel } from './ContractManifestModel';

export interface ContractStateModelAdd<TContractManifest extends ContractManifestModel = ContractManifestModel> {
  readonly script: Buffer;
  readonly manifest: TContractManifest;
}

export class ContractStateModel<TContractManifest extends ContractManifestModel = ContractManifestModel>
  implements SerializableWire<ContractStateModel> {
  public readonly script: Buffer;
  public readonly manifest: TContractManifest;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ script, manifest }: ContractStateModelAdd<TContractManifest>) {
    this.script = script;
    this.manifest = manifest;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarBytesLE(this.script);
    this.manifest.serializeWireBase(writer);
  }
}
