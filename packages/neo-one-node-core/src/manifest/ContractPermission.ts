import { ContractPermissionJSON, ECPoint, UInt160 } from '@neo-one/client-common';
import { ContractPermissionModel } from '@neo-one/client-full-common';
import { utils } from '../utils';
import { ContractManifest } from './ContractManifest';
import { ContractPermissionDescriptor } from './ContractPermissionDescriptor';

export class ContractPermission extends ContractPermissionModel<ContractPermissionDescriptor> {
  public static readonly defaultPermission = new ContractPermission({
    contract: new ContractPermissionDescriptor(),
    methods: [],
  });

  public static deserializeJSON(json: ContractPermissionJSON): ContractPermission {
    const contract = ContractPermissionDescriptor.deserializeJSON(json.contract);
    const methods = utils.wildCardFromJSON<string>(json.methods, (method) => method);

    return new this({
      contract,
      methods,
    });
  }

  public isAllowed(manifest: ContractManifest, method: string) {
    if (this.contract.isHash) {
      if (!(this.contract.hashOrGroup as UInt160).equals(manifest.hash)) {
        return false;
      }
    } else if (
      this.contract.isGroup &&
      manifest.groups.every((group) => !group.publicKey.equals(this.contract.hashOrGroup as ECPoint))
    ) {
      return false;
    }

    return this.methods === '*' || this.methods.includes(method);
  }
}
