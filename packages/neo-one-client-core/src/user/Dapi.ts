import { AddressString, AttributeUsage, Hash256String, NetworkType, PublicKeyString } from '@neo-one/client-common';

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
  readonly compatibility: readonly string[];
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
  readonly networks: readonly NetworkType[];
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

/**
 * A public key associated with a `DapiAccount`.
 */
export interface DapiPublicKey {
  /**
   * `AddressString` of the connected account
   */
  readonly address: AddressString;
  /**
   * `PublicKeyString` for the associated `AddressString`.
   */
  readonly publicKey: PublicKeyString;
}

/**
 * Options for `invokeRead`.
 */
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
  readonly args: readonly Argument[];
  /**
   * Network to submit this request to. If omitted, will default to network the wallet is currently set to.
   */
  readonly network?: string;
}

/**
 * Allowed types for invocation parameters.
 */
export type ArgumentDataType =
  | 'String'
  | 'Boolean'
  | 'Hash160'
  | 'Hash256'
  | 'Integer'
  | 'ByteArray'
  | 'Array'
  | 'Address';

/**
 * Definition of a single invocation parameter.
 */
export interface Argument {
  /**
   * Type of the parameter.
   */
  readonly type: ArgumentDataType;
  /**
   * Value of the parameter.
   */
  // tslint:disable-next-line no-any
  readonly value: any;
}

/**
 * Options for invoking a transfer of an `Asset`.
 */
export interface SendArgs {
  /**
   * `AddressString` of the connected account to send the `Asset`s from.
   */
  readonly fromAddress: AddressString;
  /**
   * `AddressString` of the receiver of the `Asset`s to be sent.
   */
  readonly toAddress: string;
  /**
   * `Asset` script hash to be sent.
   */
  readonly asset: Hash256String;
  /**
   * The parsed amount of the `Asset` to be sent.
   */
  readonly amount: string;
  /**
   * Description of the transaction to be made.
   */
  readonly remark?: string;
  /**
   * The parsed amount of network fee (in GAS) to include with transaction.
   */
  readonly fee?: string;
  /**
   * `NetworkType` to submit this request to. If omitted, will default to network the wallet is currently set to..
   */
  readonly network?: NetworkType;
  /**
   * In the case that the dApp would like to be responsible for broadcasting the signed transaction rather than the wallet provider.
   */
  readonly broadcastOverride?: boolean;
}

/**
 * NEO and GAS attached to an invocation.
 */
export interface AttachedAssets {
  /**
   * NEO attached to an invocation.
   */
  readonly NEO?: string;
  /**
   * GAS attached to an invocation.
   */
  readonly GAS?: string;
}

/**
 * Hash `Attrribute` attached to a transaction.
 */
export interface TxHashAttribute extends Argument {
  /**
   * Allowed `Attribute` types.
   */
  readonly txAttrUsage: AttributeUsage;
}

/**
 * Options for invoking a write method.
 */
export interface InvokeArgs extends InvokeReadArgs {
  /**
   * NEO and GAS attached to this invocation.
   */
  readonly attachedAssets?: AttachedAssets;
  /**
   * The parsed amount of network fee (in GAS) to include with transaction.
   */
  readonly fee?: string;
  /**
   * A hard override of all transaction utxo inputs and outputs.
   * IMPORTANT: If provided, fee and attachedAssets will be ignored.
   */
  readonly assetIntentOverrides?: AssetIntentOverrides;
  /**
   * Adds the instruction to invoke the contract verification trigger.
   */
  readonly triggerContractVerification?: boolean;
  /**
   * Adds transaction attributes.
   */
  readonly txHashAttributes?: readonly TxHashAttribute[];
}

/**
 * A hard override of all transaction utxo inputs and outputs.
 */
export interface AssetIntentOverrides {
  /**
   * Inputs to attach to the transaction.
   */
  readonly inputs: readonly AssetInput[];
  /**
   * Outputs to attach to the transaction.
   */
  readonly outputs: readonly AssetOutput[];
}

/**
 * `Input` defining the origin of an `Asset`.
 */
export interface AssetInput {
  /**
   * Hash of the `Transaction` this input references.
   */
  readonly txid: string;
  /**
   * `Output` index within the `Transaction` this input references.
   */
  readonly index: number;
}

/**
 * `Output`s represent the destination `Address` and amount transferred of a given `Asset`.
 */
export interface AssetOutput {
  /**
   * Hash of the `Asset` that was transferred.
   */
  readonly asset: Hash256String;
  /**
   * Destination `AddressString`.
   */
  readonly address: AddressString;
  /**
   * Amount transferred.
   */
  readonly value: string;
}

/**
 * Result of a write method for the `DapiProvider`.
 */
export interface WriteResult {
  /**
   * Hash of the `Transaction`.
   */
  readonly txid: string;
  /**
   * The node which the `Transaction` was broadcast to. Returned if `Transaction` is broadcast by wallet provider.
   */
  readonly nodeUrl: string;
}

export const ACCOUNT_CHANGED = 'ACCOUNT_CHANGED';
export const NETWORK_CHANGED = 'NETWORK_CHANGED';

/**
 *
 */
export type Event =
  | 'READY'
  | typeof ACCOUNT_CHANGED
  | typeof NETWORK_CHANGED
  | 'DISCONNECTED'
  | 'BLOCK_HEIGHT_CHANGED'
  | 'TRANSACTION_CONFIRMED';

export interface DapiError {
  readonly type: `NO_PROVIDER` | `CONNECTION_DENIED`;
  readonly description: string;
  readonly data: string;
}

/**
 * a common API interface for dApps to communicate with external wallet providers.
 */
export interface Dapi {
  /**
   * Returns information about the `DapiProvider`, including who this provider is, the version of their dAPI, and the NEP that the interface is compatible with.
   */
  // readonly getProvider: () => Promise<DapiProvider>;
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
  // readonly getBalance: (args: GetBalanceArgs) => Promise<BalanceResults>; unused.
  /**
   * Reads the raw value in smart contract storage.
   */
  // readonly getStorage: (args: GetStorageArgs) => Promise<{ readonly result: string }>; unused.
  /**
   * Execute a contract invocation in read-only mode.
   */
  // tslint:disable-next-line no-any
  // readonly invokeRead: (args: InvokeReadArgs) => Promise<{ readonly result: any }>; unused.
  /**
   * Returns whether the provided signature data matches the provided message and was signed by the account of the provided public key. unused.
   */
  // readonly verifyMessage: (args: VerifyMessageArgs) => Promise<{ readonly result: boolean }>;
  /**
   * Get information about a specific block. unused.
   */
  // readonly getBlock: (args: { readonly blockHeight: number; readonly network?: string }) => Promise<BlockDetails>;
  /**
   * Get information about a specific transaction. unused.
   */
  // readonly getTransaction: (args: GetTransactionArgs) => Promise<TransactionDetails>;
  /**
   * Get the application log for a given transaction. unused.
   */
  // readonly getApplicationLog: (args: GetTransactionArgs) => Promise<ApplicationLog>;
  /**
   * Invoke a transfer of a specified amount of a given asset from the connected account to another account.
   */
  readonly send: (args: SendArgs) => Promise<WriteResult>;
  /**
   * Execute a contract invocation.
   */
  readonly invoke: (args: InvokeArgs) => Promise<WriteResult>;
  /**
   * Signs a provided messaged with an account selected by user. A randomized salt prefix is added to the input string before it is signed, and it is encased in a non-executable transaction before signed. This ensures allow compatibility with Ledger devices. unused.
   */
  // readonly signMessage: (args: { readonly message: string }) => Promise<SignedMessage>;
  /**
   * Will deploy a compiled smart contract to the blockchain with the provided input parameters. The GAS cost for deploying the contract will be calculated by the provider, and displayed to the user upon tx acceptance or rejection. unused.
   */
  // readonly deploy: (args: DeployArgs) => Promise<WriteResult>;
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

/**
 * Unused Dapi interfaces
 */

// export interface TransactionDetails {
//   readonly txid: string;
//   readonly size: number;
//   readonly type: string;
//   readonly version: number;
//   readonly attributes: readonly TransactionAttribute[];
//   readonly vin: readonly any[];
//   readonly vout: readonly any[];
//   readonly sys_fee: string;
//   readonly net_fee: string;
//   readonly scripts: readonly TransactionScript[];
//   readonly script: string;
//   readonly gas: string;
//   readonly blockhash: string;
//   readonly confirmations: number;
//   readonly blocktime: number;
// }

// export interface BlockTransactionDetails {
//   readonly txid: string;
//   readonly size: number;
//   readonly type: string;
//   readonly version: number;
//   readonly attributes: readonly any[];
//   readonly vin: readonly any[];
//   readonly vout: readonly any[];
//   readonly sys_fee: string;
//   readonly net_fee: string;
//   readonly scripts: readonly any[];
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
//   readonly tx: readonly BlockTransactionDetails[]; // Block containing trading group
//   readonly confirmations: number; // Confirmation number (number of blocks after this block)
//   readonly nextblockhash: string; // Next block hash
// }

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

// export interface ApplicationLog {
//   readonly txid: string;
//   readonly blockindex: number;
//   readonly executions: readonly ExecutionDetails[];
// }

// export interface SignedMessage {
//   readonly publicKey: string; // Public key of account that signed message
//   readonly message: string; // Original message signed
//   readonly salt: string; // Salt added to original message as prefix, before signing
//   readonly data: string; // Signed message
// }

// export interface DeployArgs {
//   readonly name: string;
//   readonly version: string;
//   readonly author: string;
//   readonly email: string;
//   readonly description: string;
//   readonly needsStorage?: boolean;
//   readonly dynamicInvoke?: boolean;
//   readonly isPayable?: boolean;
//   readonly parameterList: string;
//   readonly returnType: string;
//   readonly code: string;
//   readonly network?: string;
// }

// export interface VerifyMessageArgs {
//   readonly message: string; // Salt prefix + original message
//   readonly data: string; // Signed message
//   readonly publicKey: string; // Public key of account that signed message
// }

// /**
//  * Options for requesting a balance for a single `AddressString`.
//  */
// export interface BalanceRequest {
//   /**
//    * `AddressString`s to check balance(s)
//    */
//   readonly address: AddressString;
//   /**
//    * `Asset` ID or script hash to check balance.
//    */
//   readonly assets: Hash256String | readonly Hash256String[];
//   /**
//    * Fetches to UTXO data for NEO and/or GAS if attribute is 'true'
//    */
//   readonly fetchUTXO?: boolean;
// }

// /**
//  * Options for requesting balance
//  */
// export interface GetBalanceArgs {
//   /**
//    * `BalanceRequest`(s) for the `DapiProvider` to perform.
//    */
//   readonly params: BalanceRequest | readonly BalanceRequest[];
//   /**
//    * Network to submit this request to. If omitted, will default to network the `DapiProvider` is currently set to.
//    */
//   readonly network?: NetworkType;
// }

// /**
//  * Result of a `getBalance` call.
//  */
// export interface BalanceResults {
//   /**
//    * Balances associated with a particular `AddressString`.
//    */
//   readonly [address: string]: readonly Balance[];
// }

// /**
//  * Balance of a particular `Asset`.
//  */
// export interface Balance {
//   /**
//    * `Hash256String` identifier of the `Asset`.
//    */
//   readonly assetID: Hash256String;
//   /**
//    * Symbol identifier of the `Asset`.
//    */
//   readonly symbol: string;
//   /**
//    * Balance of the `Asset`.
//    */
//   readonly amount: string;
// }

// /**
//  * Options for requesting storage.
//  */
// export interface GetStorageArgs {
//   /**
//    * script hash of the smart contract to invoke a read on
//    */
//   readonly scriptHash: string;
//   /**
//    * key of the storage value to retrieve from the contract
//    */
//   readonly key: string;
//   /**
//    * Network to submit this request to. If omitted, will default to network the wallet is currently set to.
//    */
//   readonly network?: string;
// }

// interface ExecutionDetails {
//   readonly trigger: string;
//   readonly contract: string;
//   readonly vmstate: string;
//   readonly gas_consumed: string;
//   readonly stack: readonly Argument[];
//   readonly notifications: readonly DapiNotification[];
// }

// interface TransactionAttribute {
//   readonly usage: string;
//   readonly data: string;
// }

// interface TransactionScript {
//   readonly invocation: string;
//   readonly verification: string;
// }

// interface DapiNotification {
//   readonly contract: string;
//   readonly state: {
//     readonly type: 'Array';
//     readonly value: readonly Argument[];
//   };
// }

// interface GetTransactionArgs {
//   readonly txid: string;
//   readonly network?: string;
// }
