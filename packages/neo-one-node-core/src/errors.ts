import { makeErrorWithCode } from '@neo-one/utils';

// tslint:disable-next-line export-name
export const ReceiveMessageTimeoutError = makeErrorWithCode(
  'RECEIVE_MESSAGE_TIMEOUT',
  (endpoint: string) => `Message with endpoint ${endpoint} timed out.`,
);
