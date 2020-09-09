import { common, ContractGroupJSON, crypto, JSONHelper, UInt160 } from '@neo-one/client-common';
import { ContractGroupModel } from '@neo-one/client-full-common';

export class ContractGroup extends ContractGroupModel {
  public static deserializeJSON(json: ContractGroupJSON) {
    const publicKey = common.stringToECPoint(json.publicKey);
    const signature = JSONHelper.readBuffer(json.signature);

    return new ContractGroup({
      publicKey,
      signature,
    });
  }

  public isValid(hash: UInt160) {
    return crypto.verify({
      message: hash,
      signature: this.signature,
      publicKey: this.publicKey,
    });
  }
}
