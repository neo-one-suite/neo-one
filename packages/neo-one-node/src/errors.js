/* @flow */
import type { Endpoint } from '@neo-one/node-core';

import type Message from './Message';

// eslint-disable-next-line
export class NegotiationError extends Error {
  messageObj: Message;
  code: string;

  constructor(message: Message, reason?: string) {
    super(
      `Negotiation failed. Unexpected message received: ${
        message.value.command
      }${reason == null ? '' : `. ${reason}`}`,
    );
    this.messageObj = message;
    this.code = 'NEGOTIATION';
  }
}

export class AlreadyConnectedError extends Error {
  code: string;
  endpoint: Endpoint;

  constructor(endpoint: Endpoint, reason: string) {
    super(`Negotiation failed: ${reason}`);
    this.code = 'ALREADY_CONNECTED';
    this.endpoint = endpoint;
  }
}
