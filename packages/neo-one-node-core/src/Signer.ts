import {
  assertWitnessScope,
  InvalidFormatError,
  IOHelper,
  JSONHelper,
  SignerJSON,
  SignerModel,
  toJSONWitnessScope,
  witnessScopeHasFlag,
  WitnessScopeModel,
} from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializableJSON, SerializeJSONContext } from './Serializable';
import { utils } from './utils';

const hasCustomContracts = (scopes: WitnessScopeModel) =>
  witnessScopeHasFlag(scopes, WitnessScopeModel.CustomContracts);
const hasCustomGroups = (scopes: WitnessScopeModel) => witnessScopeHasFlag(scopes, WitnessScopeModel.CustomGroups);

export class Signer extends SignerModel implements SerializableJSON<SignerJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Signer {
    const { reader } = options;
    const account = reader.readUInt160();
    const scopes = assertWitnessScope(reader.readUInt8());
    if (witnessScopeHasFlag(scopes, WitnessScopeModel.Global) && scopes !== WitnessScopeModel.Global) {
      throw new InvalidFormatError('Only the global scope should have the global flag');
    }
    const allowedContracts = hasCustomContracts(scopes) ? reader.readArray(reader.readUInt160, this.maxSubItems) : [];
    const allowedGroups = hasCustomGroups(scopes) ? reader.readArray(reader.readECPoint, this.maxSubItems) : [];

    return new Signer({
      account,
      scopes,
      allowedContracts,
      allowedGroups,
    });
  }

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

  public get size() {
    return this.sizeInternal();
  }

  public serializeJSON(_context: SerializeJSONContext): SignerJSON {
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
