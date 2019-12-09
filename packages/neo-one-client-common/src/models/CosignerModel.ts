import { BinaryWriter } from '../BinaryWriter';
import { ECPoint, UInt160 } from '../common';
import { createSerializeWire, SerializableWire, SerializeWire } from './Serializable';
import { toWitnessScope, witnessScopeHasFlag, WitnessScopeModel } from './WitnessScopeModel';

export interface CosignerAdd {
  readonly account: UInt160;
  readonly scopes: keyof typeof WitnessScopeModel;
  readonly allowedContracts?: readonly UInt160[];
  readonly allowedGroups?: readonly ECPoint[];
}

export class CosignerModel implements SerializableWire<CosignerModel> {
  public readonly account: UInt160;
  public readonly scopes: keyof typeof WitnessScopeModel;
  public readonly allowedContracts: readonly UInt160[];
  public readonly allowedGroups: readonly ECPoint[];
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ account, scopes, allowedContracts, allowedGroups }: CosignerAdd) {
    this.account = account;
    this.scopes = scopes;
    this.allowedContracts = allowedContracts === undefined ? [] : allowedContracts;
    this.allowedGroups = allowedGroups === undefined ? [] : allowedGroups;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt160(this.account);
    writer.writeUInt8(toWitnessScope(this.scopes));
    if (witnessScopeHasFlag(this.scopes, 'CustomContracts')) {
      writer.writeArray(this.allowedContracts, (contract) => writer.writeUInt160(contract));
    }
    if (witnessScopeHasFlag(this.scopes, 'CustomGroups')) {
      writer.writeArray(this.allowedGroups, (group) => writer.writeECPoint(group));
    }
  }
}
