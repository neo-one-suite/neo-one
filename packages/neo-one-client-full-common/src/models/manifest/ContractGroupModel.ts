import { ContractGroupJSON, ECPoint, JSONHelper, SerializableJSON } from '@neo-one/client-common';

export interface ContractGroupModelAdd {
  readonly publicKey: ECPoint;
  readonly signature: Buffer;
}

export class ContractGroupModel implements SerializableJSON<ContractGroupJSON> {
  public readonly publicKey: ECPoint;
  public readonly signature: Buffer;

  public constructor({ publicKey, signature }: ContractGroupModelAdd) {
    this.publicKey = publicKey;
    this.signature = signature;
  }

  public serializeJSON(): ContractGroupJSON {
    return {
      publicKey: JSONHelper.writeECPoint(this.publicKey),
      signature: JSONHelper.writeBuffer(this.signature),
    };
  }
}
