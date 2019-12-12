import { common, ContractPermissionDescriptorJSON, ECPoint, IOHelper, UInt160 } from '@neo-one/client-common';
import { ContractPermissionDescriptorModel, ContractPermissionDescriptorModelAdd } from '@neo-one/client-full-common';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializeJSONContext,
} from '../../Serializable';
import { BinaryReader, utils } from '../../utils';

export interface ContractPermissionDescriptorAdd extends ContractPermissionDescriptorModelAdd {}

export class ContractPermissionDescriptor extends ContractPermissionDescriptorModel
  implements SerializableJSON<ContractPermissionDescriptorJSON> {
  public get size(): number {
    return this.contractPermissionDescriptorSizeInternal();
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractPermissionDescriptor {
    return deserializeContractPermissionDescriptorWireBase({
      context: options.context,
      reader: options.reader,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractPermissionDescriptor {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  private readonly contractPermissionDescriptorSizeInternal = utils.lazy(() =>
    sizeOfContractPermissionDescriptor({
      hashOrGroup: this.hashOrGroup,
    }),
  );

  public serializeJSON(_context: SerializeJSONContext): ContractPermissionDescriptorJSON {
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

export const sizeOfContractPermissionDescriptor = ({
  hashOrGroup,
}: {
  readonly hashOrGroup: UInt160 | ECPoint | undefined;
}) => {
  if (hashOrGroup !== undefined) {
    if (common.isECPoint(hashOrGroup)) {
      return IOHelper.sizeOfUInt8 + IOHelper.sizeOfECPoint(hashOrGroup);
    }
    if (common.isUInt160(hashOrGroup)) {
      return IOHelper.sizeOfUInt8 + IOHelper.sizeOfUInt160;
    }
  }

  return IOHelper.sizeOfUInt8 + IOHelper.sizeOfFixedString(1);
};

export const deserializeContractPermissionDescriptorWireBase = ({
  reader,
}: DeserializeWireBaseOptions): ContractPermissionDescriptor => {
  const bytes = reader.readVarBytesLE();

  let hashOrGroup;
  if (common.isECPoint(bytes)) {
    hashOrGroup = common.bufferToECPoint(bytes);
  }
  if (common.isUInt160(bytes)) {
    hashOrGroup = common.bufferToUInt160(bytes);
  }

  return new ContractPermissionDescriptor({
    hashOrGroup,
  });
};
