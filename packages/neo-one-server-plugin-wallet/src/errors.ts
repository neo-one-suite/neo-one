import { CustomError } from '@neo-one/utils';

const extraInfo = (extra?: string) => (extra === undefined ? '' : extra);

export class NetworkRequiredError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('Wallets require a network');
    this.code = 'NETWORK_REQUIRED';
  }
}

export class ABIRequiredError extends CustomError {
  public readonly code: string;

  public constructor(extra?: string) {
    super(`ABI must be specified.${extraInfo(extra)}`);
    this.code = 'ABI_REQUIRED';
  }
}

export class ContractOrHashRequiredError extends CustomError {
  public readonly code: string;

  public constructor(extra?: string) {
    super(`Contract specification or existing contract hash is required.${extraInfo(extra)}`);

    this.code = 'CONTRACT_OR_HASH_REQUIRED';
  }
}

export class WalletRequiredError extends CustomError {
  public readonly code: string;

  public constructor(extra?: string) {
    super(`Wallet required to perform operation.${extraInfo(extra)}`);

    this.code = 'WALLET_REQUIRED';
  }
}
