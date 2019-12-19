import {
  BinaryWriter,
  common,
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

  public isHash(): boolean {
    return this.hashOrGroup === undefined ? false : common.isUInt160(this.hashOrGroup);
  }

  public isGroup(): boolean {
    return this.hashOrGroup === undefined ? false : common.isECPoint(this.hashOrGroup);
  }

  public isWildcard(): boolean {
    return this.hashOrGroup === undefined;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarBytesLE(this.hashOrGroup === undefined ? Buffer.from('*', 'utf8') : this.hashOrGroup);
  }
}
