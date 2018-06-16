import { CustomError } from '@neo-one/utils';

export class ABIRequiredError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('ABI could not be inferred automatically and is mandatory.');
    this.code = 'ABI_REQUIRED';
  }
}

export class UnknownSmartContractFormatError extends CustomError {
  public readonly code: string;

  public constructor({
    ext,
    extensions,
  }: {
    readonly ext: string;
    readonly extensions: ReadonlyArray<[string, string]>;
  }) {
    super(
      `Could not determine the type of Smart Contract. Found extension ${ext} ` +
        `Expected extensions: ${JSON.stringify(extensions)}`,
    );

    this.code = 'UNKNOWN_SMART_CONTRACT_FORMAT';
  }
}
