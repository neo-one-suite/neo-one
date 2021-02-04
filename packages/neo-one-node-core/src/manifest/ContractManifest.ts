import { ContractManifestJSON, IOHelper, JSONHelper, UInt160 } from '@neo-one/client-common';
import { ContractManifestModel } from '@neo-one/client-full-common';
import { BinaryReader, utils } from '../utils';
import { ContractABI } from './ContractABI';
import { ContractGroup } from './ContractGroup';
import { ContractPermission } from './ContractPermission';

export class ContractManifest extends ContractManifestModel<ContractABI, ContractGroup, ContractPermission> {
  public static parseBytes(bytes: Buffer) {
    const reader = new BinaryReader(bytes);

    try {
      return this.deserializeJSON(JSON.parse(reader.readVarString(this.maxLength)));
    } catch {
      // do nothing
    }

    // TODO: this is incredibly bad form. but possible but in Neo App engine
    return this.deserializeJSON(JSON.parse(bytes.toString('utf8')));
  }

  private static deserializeJSON(json: ContractManifestJSON) {
    const name = json.name;
    const groups = json.groups.map((group) => ContractGroup.deserializeJSON(group));
    const supportedStandards = json.supportedstandards;
    const abi = ContractABI.deserializeJSON(json.abi);
    const permissions = json.permissions.map((permission) => ContractPermission.deserializeJSON(permission));
    const trusts = utils.wildCardFromJSON<UInt160>(json.trusts, JSONHelper.readUInt160);
    const extra = json.extra;

    return new this({
      name,
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

  public isValid(hash: UInt160) {
    return this.groups.every((group) => group.isValid(hash));
  }
}
