import { BinaryWriter, createSerializeWire, SerializableWire, SerializeWire } from '@neo-one/client-common';
import { ContractManifestModel } from './ContractManifestModel';

export interface ContractModelAdd<TContractManifest extends ContractManifestModel = ContractManifestModel> {
  readonly id: number;
  readonly script: Buffer;
  readonly manifest: TContractManifest;
}

export class ContractModel<TContractManifest extends ContractManifestModel = ContractManifestModel>
  implements SerializableWire<ContractModel> {
  public readonly id: number;
  public readonly script: Buffer;
  public readonly manifest: TContractManifest;
  public readonly hasStorage: boolean;
  public readonly payable: boolean;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ script, manifest, id }: ContractModelAdd<TContractManifest>) {
    this.id = id;
    this.script = script;
    this.manifest = manifest;
    this.hasStorage = manifest.hasStorage;
    this.payable = manifest.payable;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt32LE(this.id);
    writer.writeVarBytesLE(this.script);
    this.manifest.serializeWireBase(writer);
  }
}
