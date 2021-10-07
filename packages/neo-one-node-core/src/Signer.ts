import {
  assertWitnessScope,
  hasCustomContracts,
  hasCustomGroups,
  InvalidFormatError,
  JSONHelper,
  SignerJSON,
  SignerModel,
  toWitnessScope,
  witnessScopeHasFlag,
  WitnessScopeModel,
} from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializableJSON } from './Serializable';

export class Signer extends SignerModel implements SerializableJSON<SignerJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Signer {
    const { reader } = options;
    const account = reader.readUInt160();
    const scopes = assertWitnessScope(reader.readUInt8());
    if (witnessScopeHasFlag(scopes, WitnessScopeModel.Global) && scopes !== WitnessScopeModel.Global) {
      throw new InvalidFormatError('Only the global scope should have the global flag');
    }
    const allowedContracts = hasCustomContracts(scopes)
      ? reader.readArray(() => reader.readUInt160(), this.maxSubItems)
      : [];
    const allowedGroups = hasCustomGroups(scopes) ? reader.readArray(() => reader.readECPoint(), this.maxSubItems) : [];

    return new Signer({
      account,
      scopes,
      allowedContracts,
      allowedGroups,
    });
  }

  public static fromJSON(json: SignerJSON): Signer {
    return new Signer({
      account: JSONHelper.readUInt160(json.account),
      scopes: toWitnessScope(json.scopes),
      allowedContracts: json.allowedcontracts ? json.allowedcontracts.map(JSONHelper.readUInt160) : undefined,
      allowedGroups: json.allowedgroups ? json.allowedgroups.map(JSONHelper.readECPoint) : undefined,
    });
  }
}
