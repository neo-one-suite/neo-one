import { common, UInt160, UInt256 } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { assertArrayStackItem, StackItem } from './StackItems';

interface OracleRequestAdd {
  readonly originalTxid: UInt256;
  readonly gasForResponse: BN;
  readonly url: string;
  readonly filter: string;
  readonly callbackContract: UInt160;
  readonly callbackMethod: string;
  readonly userData: Buffer;
}

export class OracleRequest {
  public static fromStackItem(stackItem: StackItem): OracleRequest {
    const { array } = assertArrayStackItem(stackItem);
    const originalTxid = common.bufferToUInt256(array[0].getBuffer());
    const gasForResponse = array[1].getInteger();
    const url = array[2].getString();
    const filter = array[3].getString();
    const callbackContract = common.bufferToUInt160(array[4].getBuffer());
    const callbackMethod = array[5].getString();
    const userData = array[6].getBuffer();

    return new OracleRequest({
      originalTxid,
      gasForResponse,
      url,
      filter,
      callbackContract,
      callbackMethod,
      userData,
    });
  }

  public readonly originalTxid: UInt256;
  public readonly gasForResponse: BN;
  public readonly url: string;
  public readonly filter: string;
  public readonly callbackContract: UInt160;
  public readonly callbackMethod: string;
  public readonly userData: Buffer;

  public constructor({
    originalTxid,
    gasForResponse,
    url,
    filter,
    callbackContract,
    callbackMethod,
    userData,
  }: OracleRequestAdd) {
    this.originalTxid = originalTxid;
    this.gasForResponse = gasForResponse;
    this.url = url;
    this.filter = filter;
    this.callbackContract = callbackContract;
    this.callbackMethod = callbackMethod;
    this.userData = userData;
  }
}
