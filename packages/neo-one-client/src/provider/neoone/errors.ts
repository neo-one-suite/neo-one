import { CustomError } from '@neo-one/utils';

export interface JSONRPCErrorResponse {
  readonly code: number;
  readonly message: string;
  // tslint:disable-next-line no-any
  readonly data?: any;
}

export class JSONRPCError extends CustomError {
  public readonly responseError: JSONRPCErrorResponse;
  public readonly code: string;

  public constructor(responseError: JSONRPCErrorResponse) {
    super(responseError.message);
    this.responseError = responseError;
    this.code = 'JSON_RPC';
  }
}

export class InvalidRPCResponseError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('Did not receive valid rpc response');
    this.code = 'INVALID_RPC_RESPONSE';
  }
}

export class HTTPError extends CustomError {
  public readonly status: number;
  public readonly text: string | undefined;
  public readonly code: string;

  public constructor(status: number, text?: string) {
    super(text === undefined ? `HTTP Error ${status}` : `HTTP Error ${status}: ${text}`);
    this.status = status;
    this.text = text;
    this.code = 'HTTP';
  }
}

export class MissingTransactionDataError extends CustomError {
  public readonly code: string = 'MISSING_TRANSACTION_DATA';

  public constructor(hash: string) {
    super(`Missing transaction data for transaction ${hash}`);
  }
}
