import { common, ContractPermissionJSON, ECPoint, InvalidFormatError, UInt160 } from '@neo-one/client-common';
import { ContractPermissionModel } from '@neo-one/client-full-common';
import { assertArrayStackItem, assertStructStackItem, StackItem } from '../StackItems';
import { utils } from '../utils';
import { ContractManifest } from './ContractManifest';
import { ContractPermissionDescriptor } from './ContractPermissionDescriptor';

export class ContractPermission extends ContractPermissionModel<ContractPermissionDescriptor> {
  public static readonly defaultPermission = new ContractPermission({
    contract: new ContractPermissionDescriptor(),
    methods: [],
  });

  public static fromStackItem(stackItem: StackItem): ContractPermission {
    const { array } = assertStructStackItem(stackItem);
    const contractIn = array[0];
    const contractInBuff = contractIn.isNull ? '*' : contractIn.getBuffer();
    const contract = contractIn.isNull
      ? new ContractPermissionDescriptor()
      : new ContractPermissionDescriptor({
          hashOrGroup: common.isECPoint(contractIn)
            ? common.bufferToECPoint(contractInBuff)
            : common.bufferToUInt160(contractInBuff),
        });

    const methodsIn = array[1];
    const methods = methodsIn.isNull ? '*' : assertArrayStackItem(array[1]).array.map((method) => method.getString());

    return new ContractPermission({
      contract,
      methods,
    });
  }

  public static deserializeJSON(json: ContractPermissionJSON): ContractPermission {
    const contract = ContractPermissionDescriptor.deserializeJSON(json.contract);
    const methods = utils.wildCardFromJSON<string>(json.methods, (method) => method);

    if (typeof methods !== 'string') {
      methods.forEach((method) => {
        if (method === '') {
          throw new InvalidFormatError('Contract permission method cannot be an empty string');
        }
      });
    }
    if (new Set(methods).size !== methods.length) {
      throw new InvalidFormatError('Contract permission methods cannot have duplicates');
    }

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
