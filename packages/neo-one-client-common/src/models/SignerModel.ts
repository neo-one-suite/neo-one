import { BinaryWriter } from '../BinaryWriter';
import { ECPoint, UInt160 } from '../common';
import { IOHelper } from '../IOHelper';
import { JSONHelper } from '../JSONHelper';
import { utils } from '../utils';
import { createSerializeWire, SerializableWire, SerializeWire } from './Serializable';
import { SignerJSON } from './types';
import { toJSONWitnessScope, witnessScopeHasFlag, WitnessScopeModel } from './WitnessScopeModel';

export interface SignerAdd {
  readonly account: UInt160;
  readonly scopes: WitnessScopeModel;
  readonly allowedContracts?: readonly UInt160[];
  readonly allowedGroups?: readonly ECPoint[];
}

export const hasCustomContracts = (scopes: WitnessScopeModel) =>
  witnessScopeHasFlag(scopes, WitnessScopeModel.CustomContracts);
export const hasCustomGroups = (scopes: WitnessScopeModel) =>
  witnessScopeHasFlag(scopes, WitnessScopeModel.CustomGroups);

// Limits the number of AllowedContracts or AllowedGroups for deserialize
export const MAX_SUB_ITEMS = 16;

export class SignerModel implements SerializableWire {
  public static readonly maxSubItems = MAX_SUB_ITEMS;
  public readonly account: UInt160;
  public readonly scopes: WitnessScopeModel;
  public readonly allowedContracts: readonly UInt160[];
  public readonly allowedGroups: readonly ECPoint[];
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  private readonly sizeInternal = utils.lazy(
    () =>
      IOHelper.sizeOfUInt160 +
      IOHelper.sizeOfUInt8 +
      (hasCustomContracts(this.scopes)
        ? IOHelper.sizeOfArray(this.allowedContracts, () => IOHelper.sizeOfUInt160)
        : 0) +
      (hasCustomGroups(this.scopes)
        ? IOHelper.sizeOfArray(this.allowedGroups, (ecPoint) => IOHelper.sizeOfECPoint(ecPoint))
        : 0),
  );

  public constructor({ account, scopes, allowedContracts, allowedGroups }: SignerAdd) {
    this.account = account;
    this.scopes = scopes;
    this.allowedContracts = allowedContracts === undefined ? [] : allowedContracts;
    this.allowedGroups = allowedGroups === undefined ? [] : allowedGroups;
  }

  public get size() {
    return this.sizeInternal();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt160(this.account);
    writer.writeUInt8(this.scopes);
    if (witnessScopeHasFlag(this.scopes, WitnessScopeModel.CustomContracts)) {
      writer.writeArray(this.allowedContracts, (contract) => writer.writeUInt160(contract));
    }
    if (witnessScopeHasFlag(this.scopes, WitnessScopeModel.CustomGroups)) {
      writer.writeArray(this.allowedGroups, (group) => writer.writeECPoint(group));
    }
  }

  public serializeJSON(): SignerJSON {
    return {
      account: JSONHelper.writeUInt160(this.account),
      scopes: toJSONWitnessScope(this.scopes),
      allowedcontracts: hasCustomContracts(this.scopes)
        ? this.allowedContracts.map((contract) => JSONHelper.writeUInt160(contract))
        : undefined,
      allowedgroups: hasCustomGroups(this.scopes)
        ? this.allowedGroups.map((group) => JSONHelper.writeECPoint(group))
        : undefined,
    };
  }
}
