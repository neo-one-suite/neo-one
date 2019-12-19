import { common, ContractPermissionDescriptorJSON, IOHelper } from '@neo-one/client-common';
import { ContractPermissionDescriptorModel, ContractPermissionDescriptorModelAdd } from '@neo-one/client-full-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableJSON } from '../../Serializable';
import { BinaryReader, utils } from '../../utils';

export type ContractPermissionDescriptorAdd = ContractPermissionDescriptorModelAdd;

export class ContractPermissionDescriptor extends ContractPermissionDescriptorModel
  implements SerializableJSON<ContractPermissionDescriptorJSON> {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): ContractPermissionDescriptor {
    const bytes = reader.readVarBytesLE();
    const hashOrGroup = common.isECPoint(bytes)
      ? common.bufferToECPoint(bytes)
      : common.isUInt160(bytes)
      ? common.bufferToUInt160(bytes)
      : undefined;

    return new this({
      hashOrGroup,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractPermissionDescriptor {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  private readonly sizeInternal = utils.lazy(() => {
    if (this.hashOrGroup === undefined) {
      return IOHelper.sizeOfUInt8 + IOHelper.sizeOfUInt160;
    }
    if (common.isECPoint(this.hashOrGroup)) {
      return IOHelper.sizeOfUInt8 + IOHelper.sizeOfECPoint(this.hashOrGroup);
    }

    return IOHelper.sizeOfUInt8 + IOHelper.sizeOfUInt160;
  });

  public get size(): number {
    return this.sizeInternal();
  }

  public clone(): ContractPermissionDescriptor {
    return new ContractPermissionDescriptor({
      hashOrGroup: this.hashOrGroup,
    });
  }

  public serializeJSON(): ContractPermissionDescriptorJSON {
    if (this.hashOrGroup !== undefined) {
      if (common.isECPoint(this.hashOrGroup)) {
        return common.ecPointToString(this.hashOrGroup);
      }

      if (common.isUInt160(this.hashOrGroup)) {
        return common.uInt160ToString(this.hashOrGroup);
      }
    }

    return '*';
  }
}
