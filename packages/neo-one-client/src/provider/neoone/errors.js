/* @flow */
import { CustomError } from '@neo-one/utils';

export type JSONRPCErrorResponse = {|
  code: number,
  message: string,
  data?: $FlowFixMe,
|};

export class JSONRPCError extends CustomError {
  responseError: JSONRPCErrorResponse;
  code: string;

  constructor(responseError: JSONRPCErrorResponse) {
    super(responseError.message);
    this.responseError = responseError;
    this.code = 'JSON_RPC';
  }
}

export class InvalidRPCResponseError extends CustomError {
  code: string;
  constructor() {
    super('Did not receive valid rpc response');
    this.code = 'INVALID_RPC_RESPONSE';
  }
}

export class HTTPError extends CustomError {
  status: number;
  text: ?string;
  code: string;

  constructor(status: number, text: ?string) {
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
