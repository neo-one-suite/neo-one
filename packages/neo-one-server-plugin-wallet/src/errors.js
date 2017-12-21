/* @flow */
// eslint-disable-next-line
export class NetworkRequiredError extends Error {
  code: string;

  constructor() {
    super('Wallets required a network');
    this.code = 'NETWORK_REQUIRED';
  }
}
