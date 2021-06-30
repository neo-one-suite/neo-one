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
  public static hashOrGroupFromString(stringIn: string): UInt160 | ECPoint | Wildcard {
    if (common.stringIsValidUInt160(stringIn)) {
      return common.stringToUInt160(stringIn);
    }
    if (common.stringIsValidECPoint(stringIn)) {
      return common.stringToECPoint(stringIn);
    }

    return '*';
  }
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
        group: common.ecPointToString(this.hashOrGroup as ECPoint),
      };
    }
    if (this.isHash) {
      return {
        hash: common.uInt160ToString(this.hashOrGroup as UInt160),
      };
    }

    return {
      hash: undefined,
      group: undefined,
    };
  }
}
