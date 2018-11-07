// tslint:disable no-any
import { Monitor } from '@neo-one/monitor';
import { JSONRPCError, UnknownBlockError } from '../errors';

/**
 * jsonrpc request object.
 */
export interface JSONRPCRequest {
  /**
   * Method to be invoked.
   */
  readonly method: string;
  /**
   * Invocation params.
   */
  readonly params?: any;
  /**
   * How long to leave the request open (i.e. long-polling) to wait for a result for given `method` and `params`.
   */
  readonly watchTimeoutMS?: number;
}

/**
 * jsonrpc response object.
 */
export type JSONRPCResponse = any;

/**
 * Enables browser clients. See comlink and WorkerManager.
 */
export interface JSONRPCProviderManager {
  // tslint:disable no-method-signature unified-signatures
  getInstance(): Promise<JSONRPCProvider>;
  // tslint:enable no-method-signature unified-signatures
}

/**
 * Base interface for handling `JSONRPCRequest`s and returning `JSONRPCResponse`s.
 */
export abstract class JSONRPCProvider {
  public abstract request(req: JSONRPCRequest, monitor?: Monitor): Promise<JSONRPCResponse>;

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
