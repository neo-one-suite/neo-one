import { ContractPermissionDescriptorJSON, InvalidFormatError, JSONHelper } from '@neo-one/client-common';
import { ContractPermissionDescriptorModel } from '@neo-one/client-full-common';

export class ContractPermissionDescriptor extends ContractPermissionDescriptorModel {
  public static deserializeJSON(json: ContractPermissionDescriptorJSON): ContractPermissionDescriptor {
    // TODO: Verify this is even close to being the same
    const jsonString = JSON.stringify(json);
    if (jsonString.length === 42) {
      return new ContractPermissionDescriptor({ hashOrGroup: JSONHelper.readUInt160(jsonString) });
    }
    if (jsonString.length === 66) {
      return new ContractPermissionDescriptor({ hashOrGroup: JSONHelper.readECPoint(jsonString) });
    }
    if (jsonString === '*') {
      return new ContractPermissionDescriptor();
    }

    throw new InvalidFormatError();
  }
}
