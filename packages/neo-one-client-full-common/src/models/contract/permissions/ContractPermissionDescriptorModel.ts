import {
  BinaryWriter,
  createSerializeWire,
  ECPoint,
  SerializableWire,
  SerializeWire,
  UInt160,
} from '@neo-one/client-common';
import { BaseState } from '../../BaseState';

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
  writer.writeVarBytesLE(hashOrGroup === undefined ? Buffer.from('*', 'utf8') : hashOrGroup);
};
