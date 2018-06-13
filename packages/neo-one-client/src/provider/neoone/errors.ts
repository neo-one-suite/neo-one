import { CustomError } from '@neo-one/utils';

export interface JSONRPCErrorResponse {
  code: number;
  message: string;
  data?: any;
}

export class JSONRPCError extends CustomError {
  public readonly responseError: JSONRPCErrorResponse;
  public readonly code: string;

  constructor(responseError: JSONRPCErrorResponse) {
    super(responseError.message);
    this.responseError = responseError;
    this.code = 'JSON_RPC';
  }
}

export class InvalidRPCResponseError extends CustomError {
  public readonly code: string;

  constructor() {
    super('Did not receive valid rpc response');
    this.code = 'INVALID_RPC_RESPONSE';
  }
}

export class HTTPError extends CustomError {
  public readonly status: number;
  public readonly text: string | null;
  public readonly code: string;

  constructor(status: number, text: string | null) {
    let message = `HTTP Error ${status}`;
    if (text != null) {
      message = `${message}: ${text}`;
    }
    super(message);
    this.status = status;
    this.text = text;
    this.code = 'HTTP';
  }
}

export class MissingTransactionDataError extends CustomError {
  public readonly code: string = 'MISSING_TRANSACTION_DATA';

  constructor(hash: string) {
    super(`Missing transaction data for transaction ${hash}`);
  }
}
