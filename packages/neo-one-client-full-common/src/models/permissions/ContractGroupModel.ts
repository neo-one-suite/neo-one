import { common, ContractGroupJSON, ECPoint, SerializableJSON, SignatureString } from '@neo-one/client-common';

export interface ContractGroupModelAdd {
  readonly publicKey: ECPoint;
  readonly signature: SignatureString;
}

export class ContractGroupModel implements SerializableJSON<ContractGroupJSON> {
  public readonly publicKey: ECPoint;
  public readonly signature: SignatureString;

  public constructor({ publicKey, signature }: ContractGroupModelAdd) {
    this.publicKey = publicKey;
    this.signature = signature;
  }

  public serializeJSON(): ContractGroupJSON {
    return {
      publicKey: common.ecPointToString(this.publicKey),
      signature: this.signature,
    };
  }
}
