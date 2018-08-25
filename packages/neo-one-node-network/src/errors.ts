import { Endpoint } from '@neo-one/node-core';
import { makeErrorWithCode } from '@neo-one/utils';

export const ReceiveMessageTimeoutError = makeErrorWithCode(
  'RECEIVE_MESSAGE_TIMEOUT',
  (endpoint: string) => `Message with endpoint ${endpoint} timed out.`,
);
export const UnsupportedEndpointType = makeErrorWithCode(
  'UNSUPPORTED_ENDPOINT',
  (endpoint: Endpoint) => `Unsupported endpoint type: ${endpoint}`,
);
export const SocketTimeoutError = makeErrorWithCode(
  'SOCKET_TIMEOUT',
  (address: string, port: number) => `Socket @ ${address}:${port} inactive.`,
);
