import { BinaryWriter, createSerializeWire, SerializableWire, SerializeWire } from '@neo-one/client-common';
import { ContractManifestModel } from './manifest';

export interface ContractStateModelAdd<TContractManifest extends ContractManifestModel = ContractManifestModel> {
  readonly id: number;
  readonly script: Buffer;
  readonly manifest: TContractManifest;
}

export class ContractStateModel<TContractManifest extends ContractManifestModel = ContractManifestModel>
  implements SerializableWire {
  public readonly id: number;
  public readonly script: Buffer;
  public readonly manifest: TContractManifest;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ script, manifest, id }: ContractStateModelAdd<TContractManifest>) {
    this.id = id;
    this.script = script;
    this.manifest = manifest;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt32LE(this.id);
    writer.writeVarBytesLE(this.script);
    this.manifest.serializeWireBase(writer);
  }
}
