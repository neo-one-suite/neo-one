import { BinaryWriter, createSerializeWire, SerializableWire, SerializeWire } from '@neo-one/client-common';
import { BaseState } from '../BaseState';
import { ContractManifestModel } from './ContractManifestModel';

export interface ContractModelAdd {
  readonly script: Buffer;
  readonly manifest: ContractManifestModel;
}

export class ContractModel extends BaseState implements SerializableWire<ContractModel> {
  public readonly script: Buffer;
  public readonly manifest: ContractManifestModel;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ script, manifest }: ContractModelAdd) {
    super({ version: undefined });
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
