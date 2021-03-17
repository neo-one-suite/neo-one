import { common, ContractGroupJSON, crypto, InvalidSignatureError, JSONHelper, UInt160 } from '@neo-one/client-common';
import { ContractGroupModel } from '@neo-one/client-full-common';
import { assertStructStackItem, StackItem } from '../StackItems';

export class ContractGroup extends ContractGroupModel {
  public static fromStackItem(stackItem: StackItem): ContractGroup {
    const { array } = assertStructStackItem(stackItem);
    const pubKey = array[0].getBuffer();
    const signature = array[1].getBuffer();

    return new ContractGroup({
      publicKey: common.bufferToECPoint(pubKey),
      signature,
    });
  }

  public static deserializeJSON(json: ContractGroupJSON) {
    const publicKey = common.stringToECPoint(json.publicKey);
    const signature = JSONHelper.readBuffer(json.signature);

    if (signature.length !== 64) {
      throw new InvalidSignatureError(signature.length);
    }

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
