import { common, ContractManifestJSON, InvalidFormatError, UInt160 } from '@neo-one/client-common';
import { ContractManifestModel } from '@neo-one/client-full-common';
import { Set as iSet } from 'immutable';
import { assertArrayStackItem, assertMapStackItem, assertStructStackItem, StackItem } from '../StackItems';
import { ContractABI } from './ContractABI';
import { ContractGroup } from './ContractGroup';
import { ContractPermission } from './ContractPermission';
import { ContractPermissionDescriptor } from './ContractPermissionDescriptor';

export class ContractManifest extends ContractManifestModel<ContractABI, ContractGroup, ContractPermission> {
  public static fromStackItem(stackItem: StackItem): ContractManifest {
    const { array } = assertStructStackItem(stackItem);
    const name = array[0].getString();
    const groups = assertArrayStackItem(array[1]).array.map((group) => ContractGroup.fromStackItem(group));
    if (assertMapStackItem(array[2]).count !== 0) {
      throw new InvalidFormatError('Expected manifest features map to have two properties');
    }
    const supportedStandards = assertArrayStackItem(array[3]).array.map((std) => std.getString());
    const abi = ContractABI.fromStackItem(array[4]);
    const permissions = assertArrayStackItem(array[5]).array.map((perm) => ContractPermission.fromStackItem(perm));
    const trusts = array[6].isNull
      ? '*'
      : assertArrayStackItem(array[6]).array.map((trust) => {
          const buf = trust.getBuffer();
          if (common.isUInt160(buf)) {
            return new ContractPermissionDescriptor({ hashOrGroup: common.bufferToUInt160(buf) });
          }
          if (common.isECPoint(buf)) {
            return new ContractPermissionDescriptor({ hashOrGroup: common.bufferToECPoint(buf) });
          }

          throw new InvalidFormatError('Expected trust to be a valid UInt160 or ECPoint');
        });
    const extra = JSON.parse(array[7].getBuffer().toString('utf8'));

    return new ContractManifest({
      name,
      groups,
      supportedStandards,
      abi,
      permissions,
      trusts,
      extra,
    });
  }

  public static parseBytes(bytes: Buffer) {
    if (bytes.length > ContractManifestModel.maxLength) {
      throw new InvalidFormatError('Contract manifest exceeds max length');
    }

    return this.deserializeJSON(JSON.parse(bytes.toString('utf8')));
  }

  private static deserializeJSON(json: ContractManifestJSON) {
    const name = json.name;
    if (name === '') {
      throw new InvalidFormatError('Manifest name cannot be an empty string');
    }
    const groups = json.groups.map((group) => ContractGroup.deserializeJSON(group));
    if (iSet(groups.map((g) => g.publicKey)).size !== groups.length) {
      throw new InvalidFormatError('Manifest groups cannot contain duplicates');
    }
    const supportedStandards = json.supportedstandards;
    supportedStandards.forEach((std) => {
      if (std === '') {
        throw new InvalidFormatError('Manifest supported standard cannot be an empty string');
      }
    });
    if (new Set(supportedStandards).size !== supportedStandards.length) {
      throw new InvalidFormatError('Manifest supported standards cannot contain duplicates');
    }
    const abi = ContractABI.deserializeJSON(json.abi);
    const permissions = json.permissions.map((permission) => ContractPermission.deserializeJSON(permission));
    if (iSet(permissions.map((p) => p.contract)).size !== permissions.length) {
      throw new InvalidFormatError('Manifest permissions cannot contain duplicates');
    }
    const trusts =
      json.trusts === '*' ? '*' : json.trusts.map((input) => ContractPermissionDescriptor.deserializeJSON(input));
    if (typeof trusts !== 'string' && iSet(trusts).size !== trusts.length) {
      throw new InvalidFormatError('Manifest trusts cannot contain duplicates');
    }
    const extra = json.extra;
    if (Object.keys(json.features).length !== 0) {
      throw new InvalidFormatError('Manifest features must be an empty JavaScript object');
    }

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

  public isValid(hash: UInt160) {
    return this.groups.every((group) => group.isValid(hash));
  }
}
