import {
  BinaryWriter,
  common,
  createSerializeWire,
  ECPoint,
  SerializableWire,
  SerializeWire,
  UInt160,
} from '@neo-one/client-common';
import { BaseState } from './BaseState';

export interface ContractPermissionDescriptorModelAdd {
  readonly hashOrGroup: UInt160 | ECPoint | undefined;
}

export class ContractPermissionDescriptorModel extends BaseState
  implements SerializableWire<ContractPermissionDescriptorModel> {
  public readonly hashOrGroup: UInt160 | ECPoint | undefined;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ hashOrGroup }: ContractPermissionDescriptorModelAdd) {
    super({ version: undefined });
    this.hashOrGroup = hashOrGroup;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    serializeContractPermissionDescriptorWireBase({ writer, permission: this });
  }
}

export const serializeContractPermissionDescriptorWireBase = ({
  writer,
  permission,
}: {
  readonly writer: BinaryWriter;
  readonly permission: ContractPermissionDescriptorModel;
}): void => {
  const { hashOrGroup } = permission;

  if (hashOrGroup === undefined) {
    writer.writeVarBytesLE(Buffer.from([]));
  } else if (common.isUInt160(hashOrGroup)) {
    writer.writeUInt160(hashOrGroup);
  } else if (common.isECPoint(hashOrGroup)) {
    writer.writeECPoint(hashOrGroup);
  }
};
