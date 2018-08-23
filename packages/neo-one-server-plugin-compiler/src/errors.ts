import { makeErrorWithCode } from '@neo-one/utils';

export const ABIRequiredError = makeErrorWithCode(
  'ABI_REQUIRED',
  () => 'ABI could not be inferred automatically and is mandatory.',
);
export const UnknownSmartContractFormatError = makeErrorWithCode(
  'UNKNOWN_SMART_CONTRACT_FORMAT',
  ({ ext, extensions }: { readonly ext: string; readonly extensions: ReadonlyArray<[string, string]> }) =>
    `Could not determine the type of Smart Contract. Found extension ${ext} ` +
    `Expected extensions: ${JSON.stringify(extensions)}`,
);
