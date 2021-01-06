import { ContractManifestJSON, IOHelper, JSONHelper, UInt160 } from '@neo-one/client-common';
import { ContractManifestModel } from '@neo-one/client-full-common';
import { BinaryReader, utils } from '../utils';
import { ContractABI } from './ContractABI';
import { ContractGroup } from './ContractGroup';
import { ContractPermission } from './ContractPermission';

export class ContractManifest extends ContractManifestModel<ContractABI, ContractGroup, ContractPermission> {
  public static parseBytes(bytes: Buffer) {
    const reader = new BinaryReader(bytes);
    return this.deserializeJSON(JSON.parse(reader.readVarString(this.maxLength)));
  }

  private static deserializeJSON(json: ContractManifestJSON) {
    const groups = json.groups.map((group) => ContractGroup.deserializeJSON(group));
    const supportedStandards = json.supportedstandards;
    const abi = ContractABI.deserializeJSON(json.abi);
    const permissions = json.permissions.map((permission) => ContractPermission.deserializeJSON(permission));
    const trusts = utils.wildCardFromJSON<UInt160>(json.trusts, JSONHelper.readUInt160);
    const extra = json.extra;

    return new this({
      groups,
      supportedStandards,
      abi,
      permissions,
      trusts,
      extra,
    });
  }

  private readonly sizeInternal = utils.lazy(() => {
    const size = Buffer.from(JSON.stringify(this.serializeJSON())).byteLength;

    return IOHelper.sizeOfVarUIntLE(size) + size;
  });

  public get size() {
    return this.sizeInternal();
  }

  public canCall(manifest: ContractManifest, method: string) {
    return this.permissions.some((permission) => permission.isAllowed(manifest, method));
  }

  public isValid(hash: UInt160) {
    if (!this.abi.hash.equals(hash)) {
      return false;
    }

    return this.groups.every((group) => group.isValid(hash));
  }
}
