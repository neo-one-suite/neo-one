import {
  common,
  ContractPermissionDescriptorJSON,
  ECPoint,
  SerializableJSON,
  UInt160,
  Wildcard,
} from '@neo-one/client-common';

export interface ContractPermissionDescriptorModelAdd {
  readonly hashOrGroup?: UInt160 | ECPoint | Wildcard;
}

export class ContractPermissionDescriptorModel implements SerializableJSON<ContractPermissionDescriptorJSON> {
  public readonly hashOrGroup: UInt160 | ECPoint | Wildcard;

  public constructor({ hashOrGroup }: ContractPermissionDescriptorModelAdd = {}) {
    this.hashOrGroup = hashOrGroup === undefined ? '*' : hashOrGroup;
  }

  public get isHash(): boolean {
    return common.isWildcard(this.hashOrGroup) ? false : common.isUInt160(this.hashOrGroup);
  }

  public get isGroup(): boolean {
    return common.isWildcard(this.hashOrGroup) ? false : common.isECPoint(this.hashOrGroup);
  }

  public isWildcard(): boolean {
    return common.isWildcard(this.hashOrGroup);
  }

  public serializeJSON(): ContractPermissionDescriptorJSON {
    if (this.isGroup) {
      return {
        hashOrGroup: common.ecPointToString(this.hashOrGroup as ECPoint),
        isHash: false,
        isGroup: true,
        isWildcard: false,
      };
    }
    if (this.isHash) {
      return {
        hashOrGroup: common.uInt160ToString(this.hashOrGroup as UInt160),
        isHash: true,
        isGroup: false,
        isWildcard: false,
      };
    }

    return {
      hashOrGroup: this.hashOrGroup as Wildcard,
      isHash: false,
      isGroup: false,
      isWildcard: true,
    };
  }
}
