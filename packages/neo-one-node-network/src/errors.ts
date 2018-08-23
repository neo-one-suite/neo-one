import { Endpoint } from '@neo-one/node-core';
import { makeErrorWithCode } from '@neo-one/utils';

export const ReceiveMessageTimeoutError = makeErrorWithCode(
  'RECEIVE_MESSAGE_TIMEOUT',
  () => 'Receive message timeout.',
);
export const UnsupportedEndpointType = makeErrorWithCode(
  'UNSUPPORTED_ENDPOINT',
  (endpoint: Endpoint) => `Unsupported endpoint type: ${endpoint}`,
);
export const SocketTimeoutError = makeErrorWithCode('SOCKET_TIMEOUT', () => 'Socket inactive.');
