import {
  CosignerJSON,
  CosignerModel,
  ECPoint,
  IOHelper,
  JSONHelper,
  toJSONWitnessScope,
  UInt160,
  WitnessScope,
  witnessScopeHasFlag,
} from '@neo-one/client-common';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializeJSONContext,
} from './Serializable';
import { BinaryReader, utils } from './utils';

const maxSubitems = 16;

export interface CosignerAdd {
  readonly account: UInt160;
  readonly scopes: WitnessScope;
  readonly allowedContracts?: readonly UInt160[];
  readonly allowedGroups?: readonly ECPoint[];
}

export class Cosigner extends CosignerModel implements SerializableJSON<CosignerJSON> {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): Cosigner {
    const account = reader.readUInt160();
    const scopes = toJSONWitnessScope(reader.readUInt8());
    const allowedContracts = witnessScopeHasFlag(scopes, 'CustomContracts')
      ? reader.readArray(reader.readUInt160, maxSubitems)
      : [];
    const allowedGroups = witnessScopeHasFlag(scopes, 'CustomGroups')
      ? reader.readArray(reader.readECPoint, maxSubitems)
      : [];

    return new this({
      account,
      scopes,
      allowedContracts,
      allowedGroups,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): Cosigner {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public static fromModel(cosigner: CosignerModel): Cosigner {
    return new this({
      account: cosigner.account,
      scopes: cosigner.scopes,
      allowedContracts: cosigner.allowedContracts,
      allowedGroups: cosigner.allowedGroups,
    });
  }

  private readonly sizeInternal = utils.lazy(
    () =>
      IOHelper.sizeOfUInt160 +
      IOHelper.sizeOfUInt8 +
      (witnessScopeHasFlag(this.scopes, 'CustomContracts')
        ? IOHelper.sizeOfArray(this.allowedContracts, () => IOHelper.sizeOfUInt160)
        : 0) +
      (witnessScopeHasFlag(this.scopes, 'CustomGroups')
        ? IOHelper.sizeOfArray(this.allowedGroups, (group) => IOHelper.sizeOfECPoint(group))
        : 0),
  );

  public get size(): number {
    return this.sizeInternal();
  }

  public serializeJSON(_context: SerializeJSONContext): CosignerJSON {
    return {
      account: JSONHelper.writeUInt160(this.account),
      scopes: this.scopes,
      allowedContracts: witnessScopeHasFlag(this.scopes, 'CustomContracts')
        ? this.allowedContracts.map(JSONHelper.writeUInt160)
        : undefined,
      allowedGroups: witnessScopeHasFlag(this.scopes, 'CustomGroups')
        ? this.allowedGroups.map(JSONHelper.writeECPoint)
        : undefined,
    };
  }
}
