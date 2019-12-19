import {
  BinaryWriter,
  createSerializeWire,
  ECPoint,
  SerializableWire,
  SerializeWire,
  UInt160,
} from '@neo-one/client-common';

export interface ContractPermissionDescriptorModelAdd {
  readonly hashOrGroup: UInt160 | ECPoint | undefined;
}

export class ContractPermissionDescriptorModel implements SerializableWire<ContractPermissionDescriptorModel> {
  public readonly hashOrGroup: UInt160 | ECPoint | undefined;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ hashOrGroup }: ContractPermissionDescriptorModelAdd) {
    this.hashOrGroup = hashOrGroup;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarBytesLE(this.hashOrGroup === undefined ? Buffer.from('*', 'utf8') : this.hashOrGroup);
  }
}
