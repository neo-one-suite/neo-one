/* @flow */
export class NetworkRequiredError extends Error {
  code: string;

  constructor() {
    super('Wallets required a network');
    this.code = 'NETWORK_REQUIRED';
  }
}

export class ABIRequiredError extends Error {
  code: string;

  constructor(extra?: string) {
    super(`ABI must be specified.${extra == null ? '' : ` ${extra}`}`);
    this.code = 'ABI_REQUIRED';
  }
}

export class ContractOrHashRequiredError extends Error {
  code: string;

  constructor(extra?: string) {
    super(
      `Contract specification or existing contract hash is required.${
        extra == null ? '' : ` ${extra}`
      }`,
    );
    this.code = 'CONTRACT_OR_HASH_REQUIRED';
  }
}

export class WalletRequiredError extends Error {
  code: string;

  constructor(extra?: string) {
    super(
      `Wallet required to perform operation.${
        extra == null ? '' : ` ${extra}`
      }`,
    );
    this.code = 'WALLET_REQUIRED';
  }
}
