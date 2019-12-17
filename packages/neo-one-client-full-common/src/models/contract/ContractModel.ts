import { BinaryWriter, createSerializeWire, SerializableWire, SerializeWire } from '@neo-one/client-common';
import { ContractManifestModel } from './ContractManifestModel';

export interface ContractModelAdd {
  readonly script: Buffer;
  readonly manifest: ContractManifestModel;
}

export class ContractModel implements SerializableWire<ContractModel> {
  public readonly script: Buffer;
  public readonly manifest: ContractManifestModel;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ script, manifest }: ContractModelAdd) {
    this.script = script;
    this.manifest = manifest;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    serializeContractWireBase({ writer, contract: this });
  }
}

export const serializeContractWireBase = ({
  writer,
  contract,
}: {
  readonly writer: BinaryWriter;
  readonly contract: ContractModel;
}): void => {
  writer.writeVarBytesLE(contract.script);
  contract.manifest.serializeWireBase(writer);
};
