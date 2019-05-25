import { AddressString, Hash256String, NetworkType, PublicKeyString, AttributeUsage } from '@neo-one/client-common';

/**
 * Information about the provider of a Dapi
 */
export interface DapiProvider {
  /**
   * Name of the `DapiProvider`.
   */
  readonly name: string;
  /**
   * Website of the `DapiProvider`.
   */
  readonly website: string;
  /**
   * Version of the `DapiProvider`.
   */
  readonly version: string;
  /**
   * The compatibility field will return a list of strings that corresponds to NEPs that the `DapiProvider` conforms to.
   * @example compatibility: ['NEP-14', 'NEP-23','NEP-29']
   */
  readonly compatibility: ReadonlyArray<string>;
  /**
   * This object can contain any attributes specific to the `DapiProvider`, such as an app theme.
   */
  readonly extra: object;
}

/**
 * Networks the `DapiProvider` has available to connect to, along with the default network.
 */
export interface DapiNetworks {
  /**
   * Networks the `DapiProvider` has available to connect to.
   */
  readonly networks: ReadonlyArray<NetworkType>;
  /**
   * Default network of the `DapiProvider`.
   */
  readonly defaultNetwork: NetworkType;
}

/**
 * An account provided by a `DapiProvider`.
 */
export interface DapiAccount {
  /**
   * `AddressString` of the connected account
   */
  readonly address: AddressString;
  /**
   * A label the user has set to identify their wallet.
   */
  readonly label?: string;
}

export interface DapiPublicKey {
  readonly address: AddressString;
  readonly publicKey: PublicKeyString;
}

export interface BalanceRequest {
  /**
   * `AddressString`s to check balance(s)
   */
  readonly address: AddressString;
  /**
   * `Asset` ID or script hash to check balance.
   */
  readonly assets: Hash256String | ReadonlyArray<Hash256String>;
  /**
   * Fetches to UTXO data for NEO and/or GAS if attribute is 'true'
   */
  readonly fetchUTXO?: boolean;
}

export interface Balance {
  readonly assetID: Hash256String;
  readonly symbol: string;
  readonly amount: string;
}

export interface BalanceResults {
  readonly [address: string]: ReadonlyArray<Balance>;
}

/**
 * Options for requesting balance
 */
export interface GetBalanceArgs {
  /**
   *
   */
  readonly params: BalanceRequest | ReadonlyArray<BalanceRequest>;
  /**
   * Network to submit this request to. If omitted, will default to network the `DapiProvider` is currently set to.
   */
  readonly network?: NetworkType;
}

export interface GetStorageArgs {
  /**
   * script hash of the smart contract to invoke a read on
   */
  readonly scriptHash: string;
  /**
   * key of the storage value to retrieve from the contract
   */
  readonly key: string;
  /**
   * Network to submit this request to. If omitted, will default to network the wallet is currently set to.
   */
  readonly network?: string;
}

export interface InvokeReadArgs {
  /**
   * script hash of the smart contract to invoke a read on
   */
  readonly scriptHash: string;
  /**
   * operation on the smart contract to call
   */
  readonly operation: string;
  /**
   * any input arguments for the operation
   */
  readonly args: ReadonlyArray<Argument>;
  /**
   * Network to submit this request to. If omitted, will default to network the wallet is currently set to.
   */
  readonly network?: string;
}

// export interface BlockTransactionDetails {
//   readonly txid: string;
//   readonly size: number;
//   readonly type: string;
//   readonly version: number;
//   readonly attributes: ReadonlyArray<any>;
//   readonly vin: ReadonlyArray<any>;
//   readonly vout: ReadonlyArray<any>;
//   readonly sys_fee: string;
//   readonly net_fee: string;
//   readonly scripts: ReadonlyArray<any>;
//   readonly nonce: number;
// }

// interface ScriptDetails {
//   readonly invocation: string;
//   readonly verification: string;
// }

// export interface BlockDetails {
//   readonly hash: string;
//   readonly size: number; // Block size (bytes)
//   readonly version: number; // The version number of the block execution
//   readonly previousblockhash: string; // Previous block Hash
//   readonly merkleroot: string; // Merkel root
//   readonly time: number; // Block generation timestamp
//   readonly index: number; // Block index (height)
//   readonly nonce: string; // Block pseudo-random number
//   readonly nextconsensus: string; // Next master biller
//   readonly script: ScriptDetails; // Block call signature authentication information
//   readonly tx: ReadonlyArray<BlockTransactionDetails>; // Block containing trading group
//   readonly confirmations: number; // Confirmation number (number of blocks after this block)
//   readonly nextblockhash: string; // Next block hash
// }

export interface TransactionAttribute {
  readonly usage: string;
  readonly data: string;
}

export interface TransactionScript {
  readonly invocation: string;
  readonly verification: string;
}

// export interface TransactionDetails {
//   readonly txid: string;
//   readonly size: number;
//   readonly type: string;
//   readonly version: number;
//   readonly attributes: ReadonlyArray<TransactionAttribute>;
//   readonly vin: ReadonlyArray<any>;
//   readonly vout: ReadonlyArray<any>;
//   readonly sys_fee: string;
//   readonly net_fee: string;
//   readonly scripts: ReadonlyArray<TransactionScript>;
//   readonly script: string;
//   readonly gas: string;
//   readonly blockhash: string;
//   readonly confirmations: number;
//   readonly blocktime: number;
// }

export interface DapiNotification {
  readonly contract: string;
  readonly state: {
    readonly type: 'Array';
    readonly value: ReadonlyArray<Argument>;
  };
}

export interface ExecutionDetails {
  readonly trigger: string;
  readonly contract: string;
  readonly vmstate: string;
  readonly gas_consumed: string;
  readonly stack: ReadonlyArray<Argument>;
  readonly notifications: ReadonlyArray<DapiNotification>;
}

export interface ApplicationLog {
  readonly txid: string;
  readonly blockindex: number;
  readonly executions: ReadonlyArray<ExecutionDetails>;
}

export interface GetTransactionArgs {
  readonly txid: string;
  readonly network?: string;
}

export interface Argument {
  readonly type: ArgumentDataType;
  // tslint:disable-next-line no-any
  readonly value: any;
}

export type ArgumentDataType =
  | 'String'
  | 'Boolean'
  | 'Hash160'
  | 'Hash256'
  | 'Integer'
  | 'ByteArray'
  | 'Array'
  | 'Address';

export interface VerifyMessageArgs {
  readonly message: string; // Salt prefix + original message
  readonly data: string; // Signed message
  readonly publicKey: string; // Public key of account that signed message
}

export interface SendArgs {
  readonly fromAddress: string;
  readonly toAddress: string;
  readonly asset: string;
  readonly amount: string;
  readonly remark?: string;
  readonly fee?: string;
  readonly network?: string;
}

export interface AttachedAssets {
  readonly [asset: string]: string;
}

// export type TxHashAttributeUsage =
//   | 'Hash1'
//   | 'Hash2'
//   | 'Hash3'
//   | 'Hash4'
//   | 'Hash5'
//   | 'Hash6'
//   | 'Hash7'
//   | 'Hash8'
//   | 'Hash9'
//   | 'Hash10'
//   | 'Hash11'
//   | 'Hash12'
//   | 'Hash13'
//   | 'Hash14'
//   | 'Hash15';

export interface TxHashAttribute extends Argument {
  readonly txAttrUsage: AttributeUsage;
}

export interface InvokeArgs extends InvokeReadArgs {
  readonly attachedAssets?: AttachedAssets;
  readonly fee?: string;
  readonly assetIntentOverrides?: AssetIntentOverrides;
  readonly triggerContractVerification?: boolean;
  readonly txHashAttributes?: readonly TxHashAttribute[];
}

export interface AssetIntentOverrides {
  readonly inputs: ReadonlyArray<AssetInput>;
  readonly outputs: ReadonlyArray<AssetOutput>;
}

export interface AssetInput {
  readonly txid: string;
  readonly index: number;
}

export interface AssetOutput {
  readonly asset: string;
  readonly address: string;
  readonly value: string;
}

export interface WriteResult {
  readonly txid: string;
  readonly nodeUrl: string;
}

export interface SignedMessage {
  readonly publicKey: string; // Public key of account that signed message
  readonly message: string; // Original message signed
  readonly salt: string; // Salt added to original message as prefix, before signing
  readonly data: string; // Signed message
}

export interface DeployArgs {
  readonly name: string;
  readonly version: string;
  readonly author: string;
  readonly email: string;
  readonly description: string;
  readonly needsStorage?: boolean;
  readonly dynamicInvoke?: boolean;
  readonly isPayable?: boolean;
  readonly parameterList: string;
  readonly returnType: string;
  readonly code: string;
  readonly network?: string;
}

export type Event =
  | 'READY'
  | 'ACCOUNT_CHANGED'
  | 'NETWORK_CHANGED'
  | 'DISCONNECTED'
  | 'BLOCK_HEIGHT_CHANGED'
  | 'TRANSACTION_CONFIRMED';

/**
 * a common API interface for dApps to communicate with external wallet providers.
 */
export interface Dapi {
  /**
   * Returns information about the `DapiProvider`, including who this provider is, the version of their dAPI, and the NEP that the interface is compatible with.
   */
  readonly getProvider: () => Promise<DapiProvider>;
  /**
   * Returns the networks the wallet provider has available to connect to, along with the default network the wallet is currently set to.
   */
  readonly getNetworks: () => Promise<DapiNetworks>;
  /**
   * Return the `DapiAccount` that is currently connected to the dApp.
   */
  readonly getAccount: () => Promise<DapiAccount>;
  /**
   * Return the public key of the `DapiAccount` that is currently connected to the dApp.
   */
  readonly getPublicKey: () => Promise<DapiPublicKey>;
  /**
   * Return balance of a specific asset for the given account. If the asset is omited from a request to MainNet, all asset and token balances will be returned.
   */
  readonly getBalance: (args: GetBalanceArgs) => Promise<BalanceResults>;
  /**
   * Reads the raw value in smart contract storage.
   */
  readonly getStorage: (args: GetStorageArgs) => Promise<{ readonly result: string }>;
  /**
   * Execute a contract invocation in read-only mode.
   */
  // tslint:disable-next-line no-any
  readonly invokeRead: (args: InvokeReadArgs) => Promise<{ readonly result: any }>;
  /**
   * Returns whether the provided signature data matches the provided message and was signed by the account of the provided public key.
   */
  readonly verifyMessage: (args: VerifyMessageArgs) => Promise<{ readonly result: boolean }>;
  /**
   * Get information about a specific block.
   */
  // readonly getBlock: (args: { readonly blockHeight: number; readonly network?: string }) => Promise<BlockDetails>;
  /**
   * Get information about a specific transaction.
   */
  // readonly getTransaction: (args: GetTransactionArgs) => Promise<TransactionDetails>;
  /**
   * Get the application log for a given transaction.
   */
  readonly getApplicationLog: (args: GetTransactionArgs) => Promise<ApplicationLog>;
  /**
   * Invoke a transfer of a specified amount of a given asset from the connected account to another account.
   */
  readonly send: (args: SendArgs) => Promise<WriteResult>;
  /**
   * Execute a contract invocation.
   */
  readonly invoke: (args: InvokeArgs) => Promise<WriteResult>;
  /**
   * Signs a provided messaged with an account selected by user. A randomized salt prefix is added to the input string before it is signed, and it is encased in a non-executable transaction before signed. This ensures allow compatibility with Ledger devices.
   */
  readonly signMessage: (args: { readonly message: string }) => Promise<SignedMessage>;
  /**
   * Will deploy a compiled smart contract to the blockchain with the provided input parameters. The GAS cost for deploying the contract will be calculated by the provider, and displayed to the user upon tx acceptance or rejection.
   */
  readonly deploy: (args: DeployArgs) => Promise<WriteResult>;
  /**
   * dApps can listen for events emitted by the wallet provider using the `addEventListener` method.
   */
  // tslint:disable-next-line no-any
  readonly addEventListener: (event: Event, callback: (...args: any) => void) => void;
  /**
   * Removes any callback listeners previously set for a given event.
   */
  readonly removeEventListener: (event: Event) => void;
}
