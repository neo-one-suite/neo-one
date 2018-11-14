export interface NetworkDefinition {
  readonly name: string;
  readonly rpcURL: string;
  readonly dev: boolean;
}

export interface Wallet {
  readonly name: string;
  readonly privateKey: string;
}
