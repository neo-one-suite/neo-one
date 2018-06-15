import { Endpoint } from '@neo-one/node-core';
import { CustomError } from '@neo-one/utils';
import { Message } from './Message';

export class NegotiationError extends CustomError {
  public readonly messageObj: Message;
  public readonly code: string;

  public constructor(message: Message, reason?: string) {
    super(
      `Negotiation failed. Unexpected message received: ${message.value.command}${
        reason === undefined ? '' : `. ${reason}`
      }`,
    );

    this.messageObj = message;
    this.code = 'NEGOTIATION';
  }
}

export class AlreadyConnectedError extends CustomError {
  public readonly code: string;
  public readonly endpoint: Endpoint;

  public constructor(endpoint: Endpoint, reason: string) {
    super(`Negotiation failed: ${reason}`);
    this.code = 'ALREADY_CONNECTED';
    this.endpoint = endpoint;
  }
}
