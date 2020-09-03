import { ContractPermissionDescriptorJSON, InvalidFormatError, JSONHelper } from '@neo-one/client-common';
import { ContractPermissionDescriptorModel } from '@neo-one/client-full-common';

export class ContractPermissionDescriptor extends ContractPermissionDescriptorModel {
  public static deserializeJSON(json: ContractPermissionDescriptorJSON): ContractPermissionDescriptor {
    if (json.length === 42) {
      return new ContractPermissionDescriptor({ hashOrGroup: JSONHelper.readUInt160(json) });
    }
    if (json.length === 66) {
      return new ContractPermissionDescriptor({ hashOrGroup: JSONHelper.readECPoint(json) });
    }
    if (json === '*') {
      return new ContractPermissionDescriptor();
    }

    throw new InvalidFormatError();
  }
}
