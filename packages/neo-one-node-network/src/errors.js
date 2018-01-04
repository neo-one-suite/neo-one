/* @flow */
import type { Endpoint } from '@neo-one/node-core';

export class ReceiveMessageTimeoutError extends Error {
  code: string;

  constructor() {
    super('Receive message timeout.');
    this.code = 'RECEIVE_MESSAGE_TIMEOUT';
  }
}

export class UnsupportedEndpointType extends Error {
  endpoint: Endpoint;
  code: string;

  constructor(endpoint: Endpoint) {
    super(`Unsupported endpoint type: ${endpoint}`);
    this.endpoint = endpoint;
    this.code = 'UNSUPPORTED_ENDPOINT';
  }
}
