import { makeErrorWithCode } from '@neo-one/utils';
import { toCommandJSON } from './Command';
import { Message } from './Message';

export const NegotiationError = makeErrorWithCode(
  'NEGOTIATION',
  (message: Message, reason?: string) =>
    `Negotiation failed. Unexpected message received: ${toCommandJSON(message.value.command)}${
      reason === undefined ? '' : `. ${reason}`
    }`,
);

export const AlreadyConnectedError = makeErrorWithCode(
  'ALREADY_CONNECTED',
  (reason: string) => `Negotiation failed: ${reason}`,
);
