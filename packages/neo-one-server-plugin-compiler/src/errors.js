/* @flow */
import { CustomError } from '@neo-one/utils';

export class ABIRequiredError extends CustomError {
  code: string;

  constructor() {
    super('ABI could not be inferred automatically and is mandatory.');
    this.code = 'ABI_REQUIRED';
  }
}

export class UnknownSmartContractFormatError extends CustomError {
  code: string;

  constructor({
    ext,
    extensions,
  }: {|
    ext: string,
    extensions: Array<[string, string]>,
  |}) {
    super(
      `Could not determine the type of Smart Contract. Found extension ${ext} ` +
        `Expected extensions: ${JSON.stringify(extensions)}`,
    );
    this.code = 'UNKNOWN_SMART_CONTRACT_FORMAT';
  }
}
