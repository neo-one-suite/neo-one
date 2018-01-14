/* @flow */
import { CustomError } from '@neo-one/utils';
import type { Endpoint } from '@neo-one/node-core';

export class ReceiveMessageTimeoutError extends CustomError {
  code: string;

  constructor() {
    super('Receive message timeout.');
    this.code = 'RECEIVE_MESSAGE_TIMEOUT';
  }
}

export class UnsupportedEndpointType extends CustomError {
  endpoint: Endpoint;
  code: string;

  constructor(endpoint: Endpoint) {
    super(`Unsupported endpoint type: ${endpoint}`);
    this.endpoint = endpoint;
    this.code = 'UNSUPPORTED_ENDPOINT';
  }
}

export class SocketTimeoutError extends CustomError {
  code: string;

  constructor() {
    super('Socket inactive.');
    this.code = 'SOCKET_TIMEOUT';
  }
}
