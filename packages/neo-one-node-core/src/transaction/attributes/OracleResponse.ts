import {
  assertOracleResponseCode,
  BinaryReader,
  CallFlags,
  common,
  crypto,
  JSONHelper,
  OracleResponseCode,
  OracleResponseJSON,
  OracleResponseModel,
  ScriptBuilder,
  utils,
  WitnessScopeModel,
} from '@neo-one/client-common';
import { DesignationRole } from '../../DesignationRole';
import { InvalidOracleResultError } from '../../errors';
import { VerifyOptions } from '../../Verifiable';
import { Transaction } from '../Transaction';
import { AttributeBase } from './AttributeBase';

const maxResultSize = 65535;

const getFixedScript = utils.lazy(() => {
  const builder = new ScriptBuilder();
  builder.emitDynamicAppCall(common.nativeHashes.Oracle, 'finish', CallFlags.All);

  return builder.build();
});

export class OracleResponse extends OracleResponseModel implements AttributeBase<OracleResponseJSON> {
  public static readonly fixedScript = getFixedScript();
  public static deserializeWithoutType(reader: BinaryReader): OracleResponse {
    const id = reader.readUInt64LE();
    const code = assertOracleResponseCode(reader.readUInt8());
    const result = reader.readVarBytesLE(maxResultSize);

    if (code !== OracleResponseCode.Success && result.length > 0) {
      throw new InvalidOracleResultError(code, result.length);
    }

    return new OracleResponse({
      id,
      code,
      result,
    });
  }

  public serializeJSON(): OracleResponseJSON {
    return {
      type: 'OracleResponse',
      id: this.id.toString(),
      code: this.code,
      result: JSONHelper.writeBase64Buffer(this.result),
    };
  }

  public async verify({ native, storage }: VerifyOptions, tx: Transaction) {
    if (tx.signers.some((signer) => signer.scopes !== WitnessScopeModel.None)) {
      return false;
    }

    if (!tx.script.equals(OracleResponse.fixedScript)) {
      return false;
    }

    const request = await native.Oracle.getRequest(storage, this.id);
    if (request === undefined) {
      return false;
    }

    if (!tx.networkFee.add(tx.systemFee).eq(request.gasForResponse)) {
      return false;
    }

    const currentHeight = await native.Ledger.currentIndex(storage);

    const designated = await native.RoleManagement.getDesignatedByRole(
      storage,
      DesignationRole.Oracle,
      native.Ledger,
      currentHeight + 1,
    );
    const oracleAccount = crypto.getBFTAddress(designated);

    return tx.signers.some((signer) => signer.account.equals(oracleAccount));
  }
}
