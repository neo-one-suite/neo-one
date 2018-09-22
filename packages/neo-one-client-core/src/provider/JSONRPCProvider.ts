import { Monitor } from '@neo-one/monitor';
import { JSONRPCError, UnknownBlockError } from '../errors';

export interface JSONRPCRequest {
  readonly method: string;
  // tslint:disable-next-line no-any
  readonly params?: any;
  readonly watchTimeoutMS?: number;
}

// tslint:disable-next-line no-any
export type JSONRPCResponse = any;

export abstract class JSONRPCProvider {
  public abstract request(req: JSONRPCRequest, monitor?: Monitor): Promise<JSONRPCResponse>;
  // tslint:disable-next-line no-any
  protected readonly handleResponse = (responseJSON: any): any => {
    if (responseJSON.error !== undefined) {
      if (responseJSON.error.code === -100 && responseJSON.error.message === 'Unknown block') {
        throw new UnknownBlockError();
      }
      throw new JSONRPCError(responseJSON.error);
    }

    return responseJSON.result;
  };
}
