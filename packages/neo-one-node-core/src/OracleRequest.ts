import { UInt256, UInt160, common } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { StackItem, assertArrayStackItem } from './StackItems';

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

  public originalTxid: UInt256;
  public gasForResponse: BN;
  public url: string;
  public filter: string;
  public callbackContract: UInt160;
  public callbackMethod: string;
  public userData: Buffer;

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
