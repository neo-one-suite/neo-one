import { Endpoint } from '@neo-one/node-core';
import { CustomError } from '@neo-one/utils';

export class ReceiveMessageTimeoutError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('Receive message timeout.');
    this.code = 'RECEIVE_MESSAGE_TIMEOUT';
  }
}

export class UnsupportedEndpointType extends CustomError {
  public readonly endpoint: Endpoint;
  public readonly code: string;

  public constructor(endpoint: Endpoint) {
    super(`Unsupported endpoint type: ${endpoint}`);
    this.endpoint = endpoint;
    this.code = 'UNSUPPORTED_ENDPOINT';
  }
}

export class SocketTimeoutError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('Socket inactive.');
    this.code = 'SOCKET_TIMEOUT';
  }
}
