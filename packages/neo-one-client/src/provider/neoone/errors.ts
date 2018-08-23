import { makeErrorWithCode } from '@neo-one/utils';

export interface JSONRPCErrorResponse {
  readonly code: number;
  readonly message: string;
  // tslint:disable-next-line no-any
  readonly data?: any;
}

export const JSONRPCError = makeErrorWithCode(
  'JSON_RPC',
  (responseError: JSONRPCErrorResponse) => `${responseError.message}:${responseError.code}`,
);

export const InvalidRPCResponseError = makeErrorWithCode(
  'INVALID_RPC_RESPONSE',
  () => 'Did not receive valid rpc response',
);

export const HTTPError = makeErrorWithCode(
  'HTTP',
  (status: number, text?: string) => (text === undefined ? `HTTP Error ${status}` : `HTTP Error ${status}: ${text}`),
);
export const MissingTransactionDataError = makeErrorWithCode(
  'MISSING_TRANSACTION_DATA',
  (hash: string) => `Missing transaction data for transaction ${hash}`,
);
