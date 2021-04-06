import { ContractParameterTypeModel, crypto, UInt160 } from '@neo-one/client-common';

export interface ContractAdd {
  readonly parameterList: readonly ContractParameterTypeModel[];
  readonly redeemScript?: Buffer;
  readonly scriptHash?: UInt160;
}

export class Contract {
  public static createWithRedeemScript({ parameterList, redeemScript }: ContractAdd) {
    return new this({
      parameterList,
      redeemScript,
    });
  }
  public static createWithScriptHash({ parameterList, scriptHash }: ContractAdd) {
    return new this({
      parameterList,
      scriptHash,
    });
  }
  public readonly script: Buffer;
  public readonly parameterList: readonly ContractParameterTypeModel[];
  public readonly scriptHash: UInt160;

  private constructor({ parameterList, scriptHash, redeemScript }: ContractAdd) {
    this.script = redeemScript ?? Buffer.from([]);
    this.parameterList = parameterList;
    this.scriptHash = scriptHash ?? crypto.toScriptHash(this.script);
  }
}
