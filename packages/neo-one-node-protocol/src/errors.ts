import { makeErrorWithCode } from '@neo-one/utils';
import { Message } from './Message';

export const NegotiationError = makeErrorWithCode(
  'NEGOTIATION',
  (message: Message, reason?: string) =>
    `Negotiation failed. Unexpected message received: ${message.value.command}${
      reason === undefined ? '' : `. ${reason}`
    }`,
);

export const AlreadyConnectedError = makeErrorWithCode(
  'ALREADY_CONNECTED',
  (reason: string) => `Negotiation failed: ${reason}`,
);

export const InvalidRelayStrippedTransactionType = makeErrorWithCode(
  'INVALID_TRANSACTION_TYPE_FOR_STRIPPED_RELAY',
  (type: number) => `tried to use relayStrippedTransaction on a ${type} transaction`,
);

export const RelayStrippedTransactionMismatch = makeErrorWithCode(
  'RELAY_STRIPPED_TRANSACTION_MISMATCH',
  () => "verificationTransaction and relayTransaction weren't identical transactions",
);
