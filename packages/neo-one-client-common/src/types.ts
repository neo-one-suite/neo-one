// tslint:disable deprecation no-any
import { JSONObject, OmitStrict } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import { Observable } from 'rxjs';
import { RawSourceMap } from 'source-map';
import { ECPoint, UInt160, UInt160Hex, UInt256 } from './common';
import { AttributeTypeModel, VMState, Wildcard } from './models';

/**
 * Base58 encoded string that represents a NEO address.
 *
 * Also accepts Hash160 strings (hex encoded string prefixed by '0x') when used as a parameter to a NEO•ONE function.
 * Always the base58 encoded string form when returned from a NEO•ONE function.
 *
 * @example 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR'
 * @example '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9'
 */
export type AddressString = string;
/**
 * Hex encoded string prefixed by '0x' that represents a NEO 256 bit hash.
 *
 * Examples of `Hash256String` include `Block` hashes and `Transaction` hashes.
 *
 * @example '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c'
 */
export type Hash256String = string;
/**
 * Hex encoded string that represents a buffer.
 *
 * @example '908d323aa7f92656a77ec26e8861699ef'
 */
export type BufferString = string;
/**
 * Hex encoded string that represents a public key.
 *
 * @example '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef'
 */
export type PublicKeyString = string;
/**
 * WIF strings that represents a private key.
 *
 * Also accepts hex encoded strings when used as a parameter to a NEO•ONE function.
 * Always a WIF string when returned from a NEO•ONE function.
 *
 * @example 'L1QqQJnpBwbsPGAuutuzPTac8piqvbR1HRjrY5qHup48TBCBFe4g'
 * @example '9ab7e154840daca3a2efadaf0df93cd3a5b51768c632f5433f86909d9b994a69'
 */
export type PrivateKeyString = string;
/**
 * Hex encoded string that represents a signature for a message.
 *
 * @example 'ccaab040cc25021c91567b75db4778853441869157b8f6aad960cdcf1069812480027a528ca9b98e2205027de20696f848cf81824eeb7af1d5110870870ceb67'
 */
export type SignatureString = string;
/**
 * Implementation defined string for selecting the network to use. `'main'` refers to the NEO MainNet and `'test'` refers to the NEO TestNet. `'local'` is typically used to indicate a local development network.
 */
export type NetworkType = 'main' | 'test' | string;
/**
 * Base interface for `Attribute`s
 *
 * @see Attribute
 */
export interface AttributeBase {
  readonly type: AttributeTypeModel;
}
/**
 * `Attribute` whose transaction is "high priority".
 */
export interface HighPriorityAttribute extends AttributeBase {
  /**
   * `type` specifies the `Attribute` type
   */
  readonly type: AttributeTypeModel.HighPriority;
}
/**
 * `Attribute`s are used to store additional data on `Transaction`s.
 */
export type Attribute = HighPriorityAttribute;

export type WitnessScope =
  | 'None'
  | 'CalledByEntry'
  | 'CustomContracts'
  | 'CustomGroups'
  | 'Global'
  | 'CalledByEntryAndCustomContracts'
  | 'CalledByEntryAndCustomGroups'
  | 'CalledByEntryAndCustomGroupsAndCustomContracts'
  | 'CustomContractsAndCustomGroups';

/**
 * `Witness` is just that, a 'witness' to the transaction, meaning they have approved the transaction. Can vary from a simple signature of the transaction for a given `Address`' private key or a 'witness' being a smart contract and the way it's verified is by executing the smart contract code.
 */
export interface Witness {
  /**
   * Sets up the stack for the `verification` script.
   */
  readonly invocation: BufferString;
  /**
   * A script that should leave either a `true` value on the stack if the `Witness` is valid, or `false` otherwise.
   */
  readonly verification: BufferString;
}

/**
 * TODO: document this
 */
export interface Signer {
  /**
   * Hash160 Address of the `Signer`.
   */
  readonly account: AddressString;
  /**
   * Scope of the witness.
   */
  readonly scopes: WitnessScope;
  /**
   * Array of contracts this address can verify;.
   */
  readonly allowedContracts?: readonly AddressString[];
  /**
   * Array of contract groups that this address can verify.
   */
  readonly allowedGroups?: readonly ECPoint[];
}

/**
 * Interface for `Transaction`s
 * TODO: should some of these be optional now?
 */
export interface Transaction {
  /**
   * NEO protocol version.
   */
  readonly version: number;
  /**
   * Unique number in order to ensure the hash for this contract is unique.
   */
  readonly nonce: number;
  /**
   * `Hash160` of the transaction sender.
   */
  readonly sender?: AddressString;
  /**
   * `Hash256` of this `Transaction`.
   */
  readonly hash: Hash256String;
  /**
   * Byte size of this `Transaction`.
   */
  readonly size: number;
  /**
   * Block expiration time.
   */
  readonly validUntilBlock: number;
  /**
   * `Attribute`s attached to the `Transaction`.
   */
  readonly attributes: readonly Attribute[];
  /**
   * GAS execution fee for the transaction.
   */
  readonly systemFee: BigNumber;
  /**
   * GAS network priority fee for the transaction.
   */
  readonly networkFee: BigNumber;
  /**
   * Scope where the `Witness`es are valid.
   */
  readonly signers: readonly Signer[];
  /**
   * Contract script of the `Transaction`.
   */
  readonly script: BufferString;
  /**
   * `Witness`es to the `Transaction`, i.e. the `Address`es that have signed the `Transaction`.
   */
  readonly witnesses: readonly Witness[];
}

// For Neo node returns
export interface VerboseTransaction extends Transaction {
  readonly blockHash: UInt256;
  readonly confirmations: number;
  readonly blockTime: BigNumber;
  readonly state: VMState;
}

/**
 * `Transaction` that has been confirmed on the blockchain. Includes all of the same properties as a `Transaction` as well as the `TransactionReceipt` of the confirmation.
 */
export interface ConfirmedTransaction extends Transaction {
  /**
   * 'Receipt' of the confirmed transaction on the blockchain. This contains properties like the block the `Transaction` was included in.
   */
  readonly receipt: TransactionReceipt;
}

/**
 * All of the properties of a `Block` except the `Transaction`s themselves.
 */
export interface Header {
  /**
   * NEO blockchain version.
   */
  readonly version: number;
  /**
   * Previous `Block` hash.
   */
  readonly previousBlockHash: Hash256String;
  /**
   * Merkle Root of the `Transaction`s of this `Block`.
   */
  readonly merkleRoot: Hash256String;
  /**
   * `Block` time persisted.
   */
  readonly time: BigNumber;
  /**
   * `Block` index.
   */
  readonly index: number;
  /**
   * Next consensus address.
   */
  readonly nextConsensus: AddressString;
  /**
   * `Witness`es to the `Block`'s validity.
   */
  readonly witnesses: readonly Witness[];
  /**
   * `Block` hash.
   */
  readonly hash: Hash256String;
  /**
   * 'Witness' to the `Block`'s validity.
   */
  readonly witness: Witness;
  /**
   * Size in bytes of the `Block`.
   */
  readonly size: number;
}

export interface HeaderVerbose extends Header {
  readonly confirmations: number;
  readonly nextblockhash: Hash256String;
}

/**
 * TODO: document
 */
export interface ConsensusData {
  /**
   * TODO: document
   */
  readonly primaryIndex: number;
  /**
   * Unique number in order to ensure the hash for this `ConsensusData` is unique.
   */
  readonly nonce: BufferString;
}

export interface Block extends Header {
  /**
   * `Transaction`s contained in the `Block`.
   */
  readonly transactions: readonly ConfirmedTransaction[];
  /**
   * `Transaction`s contained in the `Block`.
   */
  readonly consensusData?: ConsensusData;
}

/**
 * Receipt of a confirmed `Transaction` which contains data about the confirmation such as the `Block` index and the index of the `Transaction` within the block.
 */
export interface TransactionReceipt {
  /**
   * `Block` index of the `Transaction` for this receipt.
   */
  readonly blockIndex: number;
  /**
   * `Block` hash of the `Transaction` for this receipt.
   */
  readonly blockHash: Hash256String;
  /**
   * `Block` time of the `Transaction` for this receipt.
   */
  readonly blockTime: number;
  /**
   * Transaction index of the `Transaction` within the `Block` for this receipt.
   */
  readonly transactionIndex: number;
  /**
   * Hash of the `Transaction` within the `Block` for this receipt.
   */
  readonly transactionHash: Hash256String;
  /**
   * Ordered globally unique index of the transaction.
   */
  readonly globalIndex: BigNumber;
  /**
   * Number of `Block`s which have confirmed this transaction.
   */
  readonly confirmations: number;
}

/**
 * The result of a successful relay of a `Transaction`.
 */
export interface TransactionResult<
  TTransactionReceipt extends TransactionReceipt = TransactionReceipt,
  TTransaction extends Transaction = Transaction
> {
  /**
   * `Transaction` that was relayed.
   */
  readonly transaction: TTransaction;
  /**
   * Waits for the `Transaction` to be confirmed on the blockchain.
   *
   * @param options Optional object that controls, in particular, the time to wait for the `Transaction` to confirm before timing out.
   * @returns `Promise` that resolves when the `Transaction` has been confirmed, resolving to the confirmation receipt.
   */
  readonly confirmed: (options?: GetOptions) => Promise<TTransactionReceipt>;
}

/**
 * Common `InvocationResult` and `RawInvocationResult` properties.
 */
export interface RawTransactionResultBase {
  /**
   * GAS consumed by the operation. This is the total GAS consumed after the free GAS is subtracted.
   */
  readonly gasConsumed: BigNumber;
  /**
   * The total GAS cost before subtracting the free GAS.
   */
  readonly gasCost: BigNumber;
  /**
   * Script run by the invocation.
   */
  readonly script: BufferString;
}

/**
 * Result of a successful transaction.
 */
export interface TransactionResultSuccess<TValue> extends RawTransactionResultBase {
  /**
   * Indicates a successful transaction.
   */
  readonly state: 'HALT';
  /**
   * The return value of the transaction.
   */
  readonly value: TValue;
}

/**
 * Result of a failed transaction.
 */
export interface TransactionResultError extends RawTransactionResultBase {
  /**
   * Indicates a failed transaction.
   */
  readonly state: 'FAULT';
  /**
   * Failure reason.
   */
  readonly message: string;
}

/**
 * Either a successful or error result, `TransactionResultSuccess` and `TransactionResultError`, respectively.
 */
export type InvocationResult<TValue> = TransactionResultSuccess<TValue> | TransactionResultError;

/**
 * The receipt for a smart contract method invocation.
 */
export interface InvokeReceipt<TReturn extends Return = Return, TEvent extends Event<string, any> = Event>
  extends TransactionReceipt {
  /**
   * The result of the invocation.
   */
  readonly result: InvocationResult<TReturn>;
  /**
   * The events emitted by the smart contract during the invocation.
   */
  readonly events: readonly TEvent[];
  /**
   * The logs emitted by the smart contract during the invocation.
   */
  readonly logs: readonly Log[];
  /**
   * The original, unprocessed, raw invoke receipt. The `RawInvokeReceipt` is transformed into this object (the `InvokeReceipt`) using the `ABI` to parse out the `Event`s and `InvocationResult`.
   */
  readonly raw: RawInvokeReceipt;
}

/**
 * Represents a transfer of native assets.
 */
export interface Transfer {
  /**
   * Amount to be transferred
   */
  readonly amount: BigNumber;
  /**
   * `Hash160` in string format of the address of the `Contract` to call to make the transfer.
   */
  readonly asset: AddressString;
  /**
   * Destination address.
   */
  readonly to: AddressString;
}

/**
 * Uniquely identifies a `UserAccount` by its address and the network its used on.
 */
export interface UserAccountID {
  /**
   * Network that this address is used on.
   */
  readonly network: NetworkType;
  /**
   * The NEO address.
   */
  readonly address: AddressString;
}

/**
 * `UserAccount` is the base abstraction on which all of the @neo-one/client APIs work with.
 */
export interface UserAccount {
  /**
   * Uniquely identifies a `UserAccount` by its address and the network its used on.
   */
  readonly id: UserAccountID;
  /**
   * The name to use when displaying this account in a user-facing UI. Can be a user configured name or just the address.
   */
  readonly name: string;
  /**
   * The public key for the address.
   */
  readonly publicKey: PublicKeyString;
}

/**
 * `UserAccountProvider`s power `Client` instances. Multiple `UserAccountProvider`s may be provided, and the `Client` abstracts over them to provide a common layer of functionality independent of the underlying `UserAccountProvider`s.
 */
export interface UserAccountProvider {
  /**
   * An `Observable` that emits the currently selected `UserAccount`
   */
  readonly currentUserAccount$: Observable<UserAccount | undefined>;
  /**
   * An `Observable` that emits the available `UserAccount`s
   */
  readonly userAccounts$: Observable<readonly UserAccount[]>;
  /**
   * An `Observable` that emits the available networks this `UserAccountProvider` knows how to function with.
   */
  readonly networks$: Observable<readonly NetworkType[]>;
  /**
   * @returns the currently selected `UserAccount` or `undefined` if one is not selected.
   */
  readonly getCurrentUserAccount: () => UserAccount | undefined;
  /**
   * @returns the available `UserAccount`s
   */
  readonly getUserAccounts: () => readonly UserAccount[];
  /**
   * @returns the available networks this `UserAccountProvider` knows how to function with.
   */
  readonly getNetworks: () => readonly NetworkType[];
  /**
   * Set the given `UserAccountID` as the selected `UserAccount`.
   *
   * If the `UserAccountProvider` does not support programatically selecting a `UserAccountID`, it should only ever expose one available `UserAccount` and manage selecting other `UserAccount`s outside of the application.
   */
  readonly selectUserAccount: (id?: UserAccountID) => Promise<void>;
  /**
   * Optional support for deleting a `UserAccount`
   */
  readonly deleteUserAccount?: (id: UserAccountID) => Promise<void>;
  /**
   * Optional support for updating the name of a `UserAccount`
   */
  readonly updateUserAccountName?: (options: UpdateAccountNameOptions) => Promise<void>;
  /**
   * @returns the current `Block` height.
   */
  readonly getBlockCount: (network: NetworkType) => Promise<number>;
  /**
   * @returns `Account` for the specified network and address. Note that the provided network and address may not correspond to one of the available `UserAccount`s.
   */
  readonly getAccount: (network: NetworkType, address: AddressString) => Promise<Account>;
  /**
   * @returns `AsyncIterable` of `Block`s on the argument `network`.
   */
  readonly iterBlocks: (network: NetworkType, options?: IterOptions) => AsyncIterable<Block>;
  /**
   * While this method could be implemented simply as a function of `iterBlocks`, `iterActionsRaw` is provided in case the `UserAccountProvider` has a more efficient way of iterating over actions.
   *
   * @returns `AsyncIterable` over all actions emitted by the given `network`, filtered by the given `options`.
   */
  readonly iterActionsRaw?: (network: NetworkType, options?: IterOptions) => AsyncIterable<RawAction>;
  /**
   * Transfers native assets.
   */
  readonly transfer: (transfers: readonly Transfer[], options?: TransactionOptions) => Promise<TransactionResult>;
  /**
   * Claim all claimable GAS.
   */
  readonly claim: (options?: TransactionOptions) => Promise<TransactionResult>;
  /**
   * Invoke the specified `method` with the given `params` on `contract`.
   *
   * `paramsZipped` contains the original parameters before processing with the ABI and are typically suitable for displaying to a user.
   *
   * `verify` will be true if the transaction should trigger verification for the `contract`
   *
   * `options` may specify additional native asset transfers to include with the transaction (either to or from the contract address).
   */
  readonly invoke: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    verify: boolean,
    options?: InvokeSendUnsafeReceiveTransactionOptions,
    sourceMaps?: SourceMaps,
  ) => Promise<TransactionResult<RawInvokeReceipt>>;
  /**
   * Relays a transaction that is the first step of a two-step send process. The `Transfer`'s `to` property represents the ultimate destination of the funds, but this transaction will be constructed such that those funds are marked for transfer, not actually transferred.
   *
   * Otherwise, parameters are the same as `invoke`.
   */
  readonly invokeSend: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    transfer: Transfer,
    options?: TransactionOptions,
    sourceMaps?: SourceMaps,
  ) => Promise<TransactionResult<RawInvokeReceipt>>;
  /**
   * Relays a transaction that is the second step of a two-step send process. The `hash` is the transaction hash of the first step in the process and is used to determine the amount to transfer to the `from` address.
   *
   * Otherwise, parameters are the same as `invoke`.
   */
  readonly invokeCompleteSend: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    hash: Hash256String,
    options?: TransactionOptions,
    sourceMaps?: SourceMaps,
  ) => Promise<TransactionResult<RawInvokeReceipt>>;
  /**
   * Refunds native assets that were not processed by the contract. The `hash` is the transaction hash that should be refunded and is used to construct the transfers for this transaction.
   *
   * Otherwise, parameters are the same as `invoke`.
   */
  readonly invokeRefundAssets: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    hash: Hash256String,
    options?: TransactionOptions,
    sourceMaps?: SourceMaps,
  ) => Promise<TransactionResult<RawInvokeReceipt>>;
  /**
   * Claims GAS. Currently only supports claiming all unclaimed GAS to the contract address.
   *
   * Otherwise, parameters are the same as `invoke`.
   */
  // readonly invokeClaim: (
  //   contract: AddressString,
  //   method: string,
  //   params: ReadonlyArray<ScriptBuilderParam | undefined>,
  //   paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
  //   options?: TransactionOptions,
  //   sourceMaps?: SourceMaps,
  // ) => Promise<TransactionResult>;
  /**
   * Invokes the constant `method` on `contract` with `params` on `network`.
   */
  readonly call: (
    network: NetworkType,
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
  ) => Promise<RawCallReceipt>;
}

/**
 * An object of `UserAccountProvider`s.
 */
export interface UserAccountProviders<TUserAccountProvider extends UserAccountProvider = UserAccountProvider> {
  /**
   * Key index may be arbitrary and is primarily intended to allow for a more specific `Client` TypeScript type to enable direct access to the underlying providers, if needed.
   */
  readonly [type: string]: TUserAccountProvider;
}

/**
 * Settings that may be modified on a local NEO•ONE private network.
 */
export interface PrivateNetworkSettings {
  /**
   * Time until the next block starts to be produced.
   */
  readonly millisecondsPerBlock: number;
}

/**
 * Provides the core functionality required by the `DeveloperClient`.
 */
export interface DeveloperProvider {
  /**
   * Network the `DeveloperProvider` is acting on.
   */
  readonly network: NetworkType;
  /**
   * Trigger consensus to run immediately.
   */
  readonly runConsensusNow: () => Promise<void>;
  /**
   * Update the network's settings.
   */
  readonly updateSettings: (options: Partial<PrivateNetworkSettings>) => Promise<void>;
  /**
   * @returns the current network settings.
   */
  readonly getSettings: () => Promise<PrivateNetworkSettings>;
  /**
   * @param seconds fast forward by `seconds` number of seconds.
   */
  readonly fastForwardOffset: (seconds: number) => Promise<void>;
  /**
   * @param seconds fast forward to the unix timestamp defined by `seconds`
   */
  readonly fastForwardToTime: (seconds: number) => Promise<void>;
  /**
   * Reset the network to it's initial state, restarting from the genesis `Block`.
   */
  readonly reset: () => Promise<void>;
  /**
   * Fetch the NEO Tracker URL for the project.
   */
  readonly getNEOTrackerURL: () => Promise<string | undefined>;
  /**
   * Reset the project this network is associated with to it's initial state.
   */
  readonly resetProject: () => Promise<void>;
}

/**
 * An `Account` represents the balances of NEO, GAS an other NEP5 assets at a given `Address`.
 */
export interface Account {
  /**
   * The address of this `Account`.
   */
  readonly address: AddressString;
  /**
   * A mapping from an `AddressString` of a contract to the value of the held by the `address` for this `Account`.
   */
  readonly balances: {
    /**
     * May be `undefined` if the `address` has 0 balance.
     */
    readonly [asset: string]: BigNumber;
  };
}

/**
 * The base type of the `Event` parameters. This type is specialized automatically with the generated NEO•ONE smart contract APIs.
 */
export interface EventParameters {
  /**
   * Note that arbitrary string indices are not supported - the exact indices are implementation defined for a particular `Event` name.
   */
  readonly [name: string]: Param;
}
/**
 * Structured data emitted by a smart contract during a method invocation. Typically emitted in response to state changes within the contract and to notify contract listeners of an action happening within the contract.
 */
export interface Event<TName extends string = string, TEventParameters = EventParameters> extends RawActionBase {
  /**
   * `type` differentiates the `Event` object from other `Action` objects, i.e. `Log`.
   */
  readonly type: 'Event';
  /**
   * An implementation defined string identifying this `Event`. In the automatically generated NEO•ONE smart contract APIs this identifier distinguishes the type of `Event` and the exact type of the `parameters` of the `Event`.
   *
   * @example 'transfer'
   * @example 'mint'
   */
  readonly name: TName;
  /**
   * Structured data attached to the event.
   *
   * @example { from: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR', to: 'ALfnhLg7rUyL6Jr98bzzoxz5J7m64fbR4s', amount: new BigNumber(10) }
   */
  readonly parameters: TEventParameters;
}

/**
 * Unstructured string emitted by a smart contract during a method invocation.
 */
export interface Log extends RawActionBase {
  /**
   * `type` differentiates the `Log` object from other `Action` objects, i.e. `Event`.
   */
  readonly type: 'Log';
  /**
   * An implementation defined string representing a log message.
   */
  readonly message: string;
}

/**
 * An `Action` is either an `Event` or `Log` emitted by the smart contract during a method invocation.
 */
export type Action = Event | Log;

/**
 * Network specific smart contract configuration
 */
export interface SmartContractNetworkDefinition {
  /**
   * `AddressString` of the smart contract on the network.
   */
  readonly address: AddressString;
}

/**
 * Configuration for the smart contract by network.
 */
export interface SmartContractNetworksDefinition {
  /**
   * Network specific smart contract configuration
   */
  readonly [networkType: string]: SmartContractNetworkDefinition;
}

/**
 * Used to generate the smart contract APIs.
 */
export interface SmartContractDefinition {
  /**
   * Configuration for the smart contract by network.
   */
  readonly networks: SmartContractNetworksDefinition;
  /**
   * `Manifest` of the smart contract
   */
  readonly manifest: ContractManifestClient;
  /**
   * `SourceMaps` associated with the smart contract.
   */
  readonly sourceMaps?: SourceMaps;
}

/**
 * Additional optional options for methods that read data from a smart contract.
 */
export interface SmartContractReadOptions {
  /**
   * The network to read the smart contract data for. By default this is the network of the currently selected user account.
   */
  readonly network?: NetworkType;
}

/**
 * Additional optional options for methods that iterate over data from a smart contract.
 */
export interface SmartContractIterOptions extends SmartContractReadOptions, BlockFilter {}

/**
 * Filter that specifies (optionally) a block index to start at and (optionally) a block index to end at.
 */
export interface BlockFilter {
  /**
   * The inclusive start index for the first block to include. Leaving `undefined` means start from the beginning of the blockchain, i.e. index 0.
   */
  readonly indexStart?: number;
  /**
   * The exclusive end index for the block to start at. Leaving `undefined` means continue indefinitely, waiting for new blocks to come in.
   */
  readonly indexStop?: number;
}
/**
 * Additional optional options for methods that iterate over data by block index.
 */
export interface IterOptions extends BlockFilter {}
/**
 * Common options for operations that fetch data from the blockchain.
 */
export interface GetOptions {
  /**
   * Time in milliseconds before timing out the operation.
   */
  readonly timeoutMS?: number;
}

/**
 * Common options for all methods in the client APIs that create transactions.
 */
export interface TransactionOptions {
  // tslint:disable readonly-keyword
  /**
   * The `UserAccount` that the transaction is 'from', i.e. the one that will be used for native asset transfers, claims, and signing the transaction.
   *
   * If unspecified, the currently selected `UserAccount` is used as the `from` address.
   *
   * DApp developers will typically want to leave this unspecified.
   */
  from?: UserAccountID;
  /**
   * Additional attributes to include with the transaction.
   */
  attributes?: readonly Attribute[];
  /**
   * An optional network fee to include with the transaction.
   */
  networkFee?: BigNumber;
  /**
   * A maximum system fee to include with the transaction. Note that this is a maximum, the client APIs will automatically calculate and add a system fee to the transaction up to the value specified here.
   *
   * Leaving `systemFee` `undefined` is equivalent to `new BigNumber(0)`, i.e. no system fee.
   *
   * A `systemFee` of `-1`, i.e. `new BigNumber(-1)` indicates no limit on the fee. This is typically used only during development.
   */
  systemFee?: BigNumber;
  // tslint:enable readonly-keyword
}

/**
 * Additional options that are automatically provided by the `forward<method>Args` method. In particular, this object provides the event specification when forwarding values.
 */
export interface ForwardOptions<TEvent extends Event<string, any> = Event> {
  /**
   * Additional events that may be emitted due to forwarding arguments to another smart contract method.
   */
  readonly events?: readonly ContractEventDescriptorClient[];
  readonly __tag?: TEvent;
}

/**
 * Additional parameters available to methods that support unsafely sending native `Asset`s from the smart contract, i.e. they have been annotated with `@sendUnsafe`.
 */
export interface InvokeSendUnsafeTransactionOptions extends TransactionOptions {
  /**
   * `Transfer`s that specify native assets to send from the contract.
   */
  readonly sendFrom?: readonly Transfer[];
}

/**
 * Additional parameters available to methods that support receiving native `Asset`s to the smart contract, i.e. they have been annotated with `@receive`.
 */
export interface InvokeReceiveTransactionOptions extends TransactionOptions {
  /**
   * `Transfer`s that specify native assets to send to the contract.
   */
  readonly sendTo?: ReadonlyArray<OmitStrict<Transfer, 'to'>>;
}

/**
 * Additional parameters available to methods that support unsafely sending native `Asset`s from the smart contract and receiving native `Asset`s to the smart contract, i.e. they have been annotated with both `@sendUnsafe` and `@receive`.
 */
export interface InvokeSendUnsafeReceiveTransactionOptions
  extends InvokeSendUnsafeTransactionOptions,
    InvokeReceiveTransactionOptions {}

/**
 * Options for the `UserAccountProvider#updateAccountName` method.
 */
export interface UpdateAccountNameOptions {
  /**
   * `UserAccountID` of the `UserAccount` to update.
   */
  readonly id: UserAccountID;
  /**
   * New name of the `UserAccount`.
   */
  readonly name: string;
}

/**
 * Common properties of all `ABIReturn` specifications.
 *
 * @see ABIReturn
 */
export interface ABIReturnBase {
  /**
   * `true` if the value can be `undefined`
   */
  readonly optional?: boolean;
  /**
   * `true` if the smart contract expects this value to be forwarded by another smart contract.
   */
  readonly forwardedValue?: boolean;
}

/**
 * `Any` return type.
 *
 * @see ABIReturn
 */
export interface AnyABIReturn extends ABIReturnBase {
  /**
   * `type` differentiates the `AnyABIReturn` object from other `ABIReturn` objects.
   */
  readonly type: 'Any';
}
/**
 * `Address` return type.
 *
 * @see ABIReturn
 * @see AddressString
 */
export interface Hash160ABIReturn extends ABIReturnBase {
  /**
   * `type` differentiates the `Hash160ABIReturn` object from other `ABIReturn` objects.
   */
  readonly type: 'Hash160';
}
/**
 * `Array` return type.
 */
export interface ArrayABIReturn extends ABIReturnBase {
  /**
   * `type` differentiates the `ArrayABIReturn` object from other `ABIReturn` objects.
   */
  readonly type: 'Array';
  /**
   * Value type of the `Array`.
   */
  readonly value: ABIReturn;
}
/**
 * `boolean` return type.
 *
 * @see ABIReturn
 */
export interface BooleanABIReturn extends ABIReturnBase {
  /**
   * `type` differentiates the `BooleanABIReturn` object from other `ABIReturn` objects.
   */
  readonly type: 'Boolean';
}
/**
 * `Buffer` return type.
 *
 * @see ABIReturn
 * @see BufferString
 */
export interface BufferABIReturn extends ABIReturnBase {
  /**
   * `type` differentiates the `BufferABIReturn` object from other `ABIReturn` objects.
   */
  readonly type: 'Buffer';
}
/**
 * `ForwardValue` return type.
 */
export interface ForwardValueABIReturn extends ABIReturnBase {
  /**
   * `type` differentiates the `ForwardValueABIReturn` object from other `ABIReturn` objects.
   */
  readonly type: 'ForwardValue';
}
/**
 * `Hash256` return type.
 *
 * @see ABIReturn
 * @see Hash256String
 */
export interface Hash256ABIReturn extends ABIReturnBase {
  /**
   * `type` differentiates the `Hash256ABIReturn` object from other `ABIReturn` objects.
   */
  readonly type: 'Hash256';
}
/**
 * `Fixed<decimals>` return type. `decimals` indicates to the client APIs how many decimals the integer represents.
 *
 * @see Fixed<Decimals>
 */
export interface IntegerABIReturn extends ABIReturnBase {
  /**
   * `type` differentiates the `IntegerABIReturn` object from other `ABIReturn` objects.
   */
  readonly type: 'Integer';
  /**
   * Number of decimals values of this type represent.
   */
  readonly decimals: number;
}
/**
 * `Map` return type.
 */
export interface MapABIReturn extends ABIReturnBase {
  /**
   * `type` differentiates the `MapABIReturn` object from other `ABIReturn` objects.
   */
  readonly type: 'Map';
  /**
   * Key type of the `Map`.
   */
  readonly key: ABIReturn;
  /**
   * Value type of the `Map`.
   */
  readonly value: ABIReturn;
}
/**
 * `Object` return type.
 */
export interface ObjectABIReturn extends ABIReturnBase {
  /**
   * `type` differentiates the `ObjectABIReturn` object from other `ABIReturn` objects.
   */
  readonly type: 'Object';
  /**
   * Properties of the `Object`.
   */
  readonly properties: { readonly [key: string]: ABIReturn };
}
/**
 * `PublicKey` return type.
 *
 * @see ABIReturn
 * @see PublicKeyString
 */
export interface PublicKeyABIReturn extends ABIReturnBase {
  /**
   * `type` differentiates the `PublicKeyABIReturn` object from other `ABIReturn` objects.
   */
  readonly type: 'PublicKey';
}
/**
 * `Signature` return type.
 *
 * @see ABIReturn
 * @see SignatureString
 */
export interface SignatureABIReturn extends ABIReturnBase {
  /**
   * `type` differentiates the `SignatureABIReturn` object from other `ABIReturn` objects.
   */
  readonly type: 'Signature';
}
/**
 * `string` return type.
 *
 * @see ABIReturn
 */
export interface StringABIReturn extends ABIReturnBase {
  /**
   * `type` differentiates the `StringABIReturn` object from other `ABIReturn` objects.
   */
  readonly type: 'String';
}
/**
 * `void` return type.
 */
export interface VoidABIReturn extends ABIReturnBase {
  /**
   * `type` differentiates the `VoidABIReturn` object from other `ABIReturn` objects.
   */
  readonly type: 'Void';
}

/**
 * Default value is the `Transaction` sender `Address`
 */
export interface SenderAddressABIDefault {
  /**
   * `type` differentiates the `SenderAddressABIDefault` object from other `ABIDefault` objects.
   */
  readonly type: 'sender';
}

/**
 * Default value for the constructor/deploy parameter.
 */
export type ABIDefault = SenderAddressABIDefault;
/**
 * All possible `ABIDefault#type` fields.
 */
export type ABIDefaultType = ABIDefault['type'];

/**
 * Base interface for all `ABIParameter`s
 */
export interface ABIParameterBase {
  /**
   * Name of the parameter.
   */
  readonly name: string;
  /**
   * Runtime default value.
   */
  readonly default?: ABIDefault;
  /**
   * Represents a rest parameter.
   */
  readonly rest?: boolean;
}

/**
 * `Any` parameter type.
 *
 * @see ABIParameter
 * @see AnyABIReturn
 */
export interface AnyABIParameter extends ABIParameterBase, AnyABIReturn {}
/**
 * `Address` parameter type.
 *
 * @see ABIParameter
 * @see Hash160ABIReturn
 * @see AddressString
 */
export interface Hash160ABIParameter extends ABIParameterBase, Hash160ABIReturn {}
/**
 * `Array` parameter type.
 *
 * @see ABIParameter
 * @see ArrayABIReturn
 */
export interface ArrayABIParameter extends ABIParameterBase, ArrayABIReturn {}
/**
 * `boolean` parameter type.
 *
 * @see ABIParameter
 * @see BooleanABIReturn
 */
export interface BooleanABIParameter extends ABIParameterBase, BooleanABIReturn {}
/**
 * `Buffer` parameter type.
 *
 * @see ABIParameter
 * @see BufferABIReturn
 * @see BufferString
 */
export interface BufferABIParameter extends ABIParameterBase, BufferABIReturn {}
/**
 * `Hash256` parameter type.
 *
 * @see ABIParameter
 * @see Hash256ABIReturn
 * @see Hash256String
 */
export interface Hash256ABIParameter extends ABIParameterBase, Hash256ABIReturn {}
/**
 * `Fixed<decimals>` parameter type. `decimals` indicates to the client APIs how many decimals the integer represents.
 *
 * @see ABIParameter
 * @see IntegerABIReturn
 * @see Fixed<Decimals>
 */
export interface IntegerABIParameter extends ABIParameterBase, IntegerABIReturn {}
/**
 * `ForwardValue` parameter type.
 *
 * @see ABIParameter
 * @see ForwardValueABIReturn
 */
export interface ForwardValueABIParameter extends ABIParameterBase, ForwardValueABIReturn {}
/**
 * `Map` parameter type.
 *
 * @see ABIParameter
 * @see MapABIReturn
 */
export interface MapABIParameter extends ABIParameterBase, MapABIReturn {}
/**
 * `Object` parameter type.
 *
 * @see ABIParameter
 * @see ObjectABIReturn
 */
export interface ObjectABIParameter extends ABIParameterBase, ObjectABIReturn {}
/**
 * `PublicKey` parameter type.
 *
 * @see ABIParameter
 * @see PublicKeyABIReturn
 * @see PublicKeyString
 */
export interface PublicKeyABIParameter extends ABIParameterBase, PublicKeyABIReturn {}
/**
 * `Signature` parameter type.
 *
 * @see ABIParameter
 * @see SignatureABIReturn
 * @see SignatureString
 */
export interface SignatureABIParameter extends ABIParameterBase, SignatureABIReturn {}
/**
 * `string` parameter type.
 *
 * @see ABIParameter
 * @see StringABIReturn
 */
export interface StringABIParameter extends ABIParameterBase, StringABIReturn {}
/**
 * `void` parameter type.
 *
 * @see ABIParameter
 * @see VoidABIReturn
 */
export interface VoidABIParameter extends ABIParameterBase, VoidABIReturn {}

/**
 * Return type specification of a function in the `ABI` of a smart contract.
 */
export type ABIReturn =
  | AnyABIReturn
  | SignatureABIReturn
  | BooleanABIReturn
  | Hash160ABIReturn
  | Hash256ABIReturn
  | BufferABIReturn
  | PublicKeyABIReturn
  | StringABIReturn
  | ArrayABIReturn
  | MapABIReturn
  | ObjectABIReturn
  | VoidABIReturn
  | IntegerABIReturn
  | ForwardValueABIReturn;
/**
 * Parameter specification of a function or event in the `ABI` of a smart contract.
 */
export type ABIParameter =
  | AnyABIParameter
  | SignatureABIParameter
  | BooleanABIParameter
  | Hash160ABIParameter
  | Hash256ABIParameter
  | BufferABIParameter
  | PublicKeyABIParameter
  | StringABIParameter
  | ArrayABIParameter
  | MapABIParameter
  | ObjectABIParameter
  | VoidABIParameter
  | IntegerABIParameter
  | ForwardValueABIParameter;

export type AnyABI = AnyABIParameter | AnyABIReturn;
export type ArrayABI = ArrayABIParameter | ArrayABIReturn;
export type MapABI = MapABIParameter | MapABIReturn;
export type ObjectABI = ObjectABIParameter | ObjectABIReturn;
export type SignatureABI = SignatureABIParameter | SignatureABIReturn;
export type BooleanABI = BooleanABIParameter | BooleanABIReturn;
export type Hash160ABI = Hash160ABIParameter | Hash160ABIReturn;
export type Hash256ABI = Hash256ABIParameter | Hash256ABIReturn;
export type BufferABI = BufferABIParameter | BufferABIReturn;
export type PublicKeyABI = PublicKeyABIParameter | PublicKeyABIReturn;
export type StringABI = StringABIParameter | StringABIReturn;
export type VoidABI = VoidABIParameter | VoidABIReturn;
export type IntegerABI = IntegerABIParameter | IntegerABIReturn;
export type ForwardValueABI = ForwardValueABIParameter | ForwardValueABIReturn;

/**
 * Method specification in the `ABI` of a smart contract generated by the NEO•ONE compiler and
 * for use in Client APIs. `ContractMethodDescriptClient` provides extra information for use in
 * the NEO•ONE Client.
 */
export interface ContractMethodDescriptorClient {
  /**
   * Name of the method.
   */
  readonly name: string;
  /**
   * Parameters of the method.
   * TODO: describe
   */
  readonly parameters?: readonly ABIParameter[];
  /**
   * Return type of the method.
   * TODO: describe
   */
  readonly returnType: ABIReturn;
  /**
   * TODO: fill out description here
   */
  readonly offset: number;
  /**
   * `true` if the function is constant or read-only.
   */
  readonly constant?: boolean;
  /**
   * `true` if the function is used for sending native assets with a two-phase send.
   */
  readonly send?: boolean;
  /**
   * `true` if the function is used for sending native assets.
   */
  readonly sendUnsafe?: boolean;
  /**
   * `true` if the function is used for receiving native assets.
   */
  readonly receive?: boolean;
  /**
   * `true` if the function is used for claiming GAS.
   */
  readonly claim?: boolean;
  /**
   * `true` if the function is used for refunding native assets.
   */
  readonly refundAssets?: boolean;
  /**
   * `true` if the function is used for the second phase of a send.
   */
  readonly completeSend?: boolean;
}

/**
 * Method specification in the `ABI` of a smart contract.
 */
export interface ContractMethodDescriptor {
  /**
   * Name of the method.
   */
  readonly name: string;
  /**
   * Parameters of the method.
   */
  readonly parameters?: readonly ContractParameterDefinition[];
  /**
   * Return type of the method.
   */
  readonly returnType: ContractParameterType;
  /**
   * TODO: fill out description here
   */
  readonly offset: number;
}

/**
 * Event specification in the `ABI` of a smart contract generated by the NEO•ONE compiler
 * for use with NEO•ONE Client APIs.
 * TODO: describe
 */
export interface ContractEventDescriptorClient {
  /**
   * Name of the event.
   */
  readonly name: string;
  /**
   * Parameters of the event.
   * TODO: describe
   */
  readonly parameters: readonly ABIParameter[];
}

/**
 * Event specification in the `ABI` of a smart contract.
 */
export interface ContractEventDescriptor {
  /**
   * Name of the event.
   */
  readonly name: string;
  /**
   * Parameters of the event.
   */
  readonly parameters: readonly ContractParameterDefinition[];
}

/**
 * TODO: describe
 * Full specification of the functions and events of a smart contract. Used by the client APIs to generate the smart contract interface.
 *
 * See the [Smart Contract APIs](https://neo-one.io/docs/smart-contract-apis) chapter of the main guide for more information.
 */
export interface ContractABIClient {
  /**
   * Script hash of the contract.
   */
  readonly hash: UInt160;
  /**
   * TODO: describe
   * Specification of the smart contract methods.
   */
  readonly methods: readonly ContractMethodDescriptorClient[];
  /**
   * TODO: describe
   * Specification of the smart contract events.
   */
  readonly events: readonly ContractEventDescriptorClient[];
}

/**
 * Full specification of the functions and events of a smart contract. Used by the client APIs to generate the smart contract interface.
 *
 * See the [Smart Contract APIs](https://neo-one.io/docs/smart-contract-apis) chapter of the main guide for more information.
 */
export interface ContractABI {
  /**
   * Script hash of the contract.
   */
  readonly hash: UInt160;
  /**
   * Specification of the smart contract methods.
   */
  readonly methods: readonly ContractMethodDescriptor[];
  /**
   * Specification of the smart contract events.
   */
  readonly events: readonly ContractEventDescriptor[];
}

/**
 * A ContractGroup represents a set of mutually trusted contracts. A contract will allow any contract in the same
 * group to invoke it, and the user interface will not give any warnings. A group is identified by a public key
 * and must be accompanied by a signature for the contract hash to prove the contract is included in the group.
 */
export interface ContractGroup {
  /**
   * The public key identifying the group.
   * TODO: should this be some sort of string? Like ECPointString?
   */
  readonly publicKey: ECPoint;
  /**
   * Signature of the contract hash.
   */
  readonly signature: BufferString;
}

/**
 * Flag which determines which features are available to a contract.
 */
export enum ContractFeatures {
  /**
   * Contract does not use any available features.
   */
  NoProperty = 0x00,
  /**
   * Contract modifies blockchain storage.
   */
  HasStorage = 0x01,
  /**
   * Contract can receive native assets.
   */
  Payable = 0x04,
  /**
   * Contract modifies blockchain storage and can receive native assets.
   */
  HasStoragePayable = 0x05,
}

export type WildcardContainer<T> = readonly T[] | Wildcard;

/**
 * Describes the contract to be invoked. Can be a contract hash, the public key of a group, or a wildcard.
 * If it specifies a contract hash, then that contract will be invoked. If it specifies the public key of a group,
 * then any contract in that group will be invoked. If it specifies a wildcard, then any contract will be invoked.
 */
export interface ContractPermissionDescriptor {
  readonly hashOrGroup: UInt160 | ECPoint | Wildcard;
  /**
   * True if the permission is for a `UInt160`.
   */
  readonly isHash: boolean;
  /**
   * True if the permission is for an `ECPoint`, representing a `ContractGroup`.
   */
  readonly isGroup: boolean;
  /**
   * True if the permission is a wildcard (*), meaning any group or address can call this `Contract`.
   */
  readonly isWildcard: boolean;
}

/**
 * Describes which contracts may be invoked and which methods are called.
 */
export interface ContractPermission {
  /**
   * Indicates the contract to be invoked. Can be either a contract hash, the public key of a group, or a wildcard.
   */
  readonly contract: ContractPermissionDescriptor;
  /**
   * An array containing a set of methods to be called. If it is a wildcard then any method can be called.
   * If a contract invokes a contract or method that is not declared in the manifest at runtime, the invocation will fail.
   */
  readonly methods: WildcardContainer<string>;
}

/**
 * A manifest explicitly declares the features and permissions a Contract will use. Once deployed,
 * it will be limited by its declared list of features and permissions. `ContractManifestClient`
 * specifically contains extra contract information for use in the NEO•ONE Client
 */
export interface ContractManifestClient {
  /**
   * The `Contract`'s hash.
   */
  readonly hash: UInt160;
  /**
   * The `Contract`'s hash as a hex string.
   * TODO: we didn't include hashHex in the old `Contract` type definition
   * Not sure if it belongs in this type here
   */
  readonly hashHex: UInt160Hex;
  /**
   * Set of mutually trusted contracts.
   */
  readonly groups: readonly ContractGroup[];
  /**
   * The features field describes what features are available for the contract.
   */
  readonly features: {
    readonly storage: boolean;
    readonly payable: boolean;
  };
  /**
   * The Neo Enhancement Proposals (NEPs) and other standards that this smart contract supports.
   */
  readonly supportedStandards: readonly string[];
  /**
   * TODO: description
   * Full specification of the functions and events of a smart contract. Used by the Client APIs
   * to generate the smart contract interface.
   */
  readonly abi: ContractABIClient;
  /**
   * Describes which contracts may be invoked and which methods are called.
   */
  readonly permissions: readonly ContractPermission[];
  /**
   * The trusts field is an array containing a set of contract hashes or group of public keys.
   */
  readonly trusts: WildcardContainer<UInt160>;
  /**
   * The safeMethods field is an array containing a set of safe methods.
   */
  readonly safeMethods: WildcardContainer<string>;
  /**
   * Custom user-defined JSON object.
   */
  readonly extra?: JSONObject;
  /**
   * True if the `Contract` modified blockchain storage.
   */
  readonly hasStorage: boolean;
  /**
   * True if the `Contract` can receive native assets.
   */
  readonly payable: boolean;
}

/**
 * A manifest explicitly declares the features and permissions a Contract will use. Once deployed,
 * it will be limited by its declared list of features and permissions.
 */
export interface ContractManifest {
  /**
   * The `Contract`'s hash.
   */
  readonly hash: UInt160;
  /**
   * The `Contract`'s hash as a hex string.
   * TODO: we didn't include hashHex in the old `Contract` type definition
   * Not sure if it belongs in this type here
   */
  readonly hashHex: UInt160Hex;
  /**
   * Set of mutually trusted contracts.
   */
  readonly groups: readonly ContractGroup[];
  /**
   * The features field describes what features are available for the contract.
   */
  readonly features: {
    readonly storage: boolean;
    readonly payable: boolean;
  };
  /**
   * The Neo Enhancement Proposals (NEPs) and other standards that this smart contract supports.
   */
  readonly supportedStandards: readonly string[];
  /**
   * Full specification of the functions and events of a smart contract. Used by the Client APIs
   * to generate the smart contract interface.
   */
  readonly abi: ContractABI;
  /**
   * Describes which contracts may be invoked and which methods are called.
   */
  readonly permissions: readonly ContractPermission[];
  /**
   * The trusts field is an array containing a set of contract hashes or group of public keys.
   */
  readonly trusts: WildcardContainer<UInt160>;
  /**
   * The safeMethods field is an array containing a set of safe methods.
   */
  readonly safeMethods: WildcardContainer<string>;
  /**
   * Custom user-defined JSON object.
   */
  readonly extra?: JSONObject;
  /**
   * True if the `Contract` modified blockchain storage.
   */
  readonly hasStorage: boolean;
  /**
   * True if the `Contract` can receive native assets.
   */
  readonly payable: boolean;
}

declare const OpaqueTagSymbol: unique symbol;
/**
 * `ForwardValue` represents a value that's intended to be forwarded to another smart contract method. This object is not meant to be directly constructued, instead one should produce them via the automatically generated `forward<method>Args` methods.
 *
 * See the [Forward Values](https://neo-one.io/docs/forward-values) chapter of the advanced guide for more information.
 */
export interface ForwardValue {
  readonly name: string;
  readonly converted: ScriptBuilderParam | undefined;
  readonly param: Param | undefined;
  readonly [OpaqueTagSymbol]: unique symbol;
}

export interface ScriptBuilderParamArray extends Array<ScriptBuilderParam> {}
export interface ScriptBuilderParamMap extends Map<ScriptBuilderParam, ScriptBuilderParam> {}
export interface ScriptBuilderParamObject {
  readonly [key: string]: ScriptBuilderParam;
}
/**
 * `Param` is converted internally via the `ABI` definition into a `ScriptBuilderParam` which is used to actually invoke the method on the smart contract.
 */
export type ScriptBuilderParam =
  | undefined
  | BN
  | number
  | UInt160
  | UInt256
  | ECPoint
  | string
  | Buffer
  | boolean
  | ScriptBuilderParamArray
  | ScriptBuilderParamMap
  | ScriptBuilderParamObject;

export interface ScriptBuilderParamToCallbacks<T> {
  readonly undefined: () => T;
  readonly array: (param: ScriptBuilderParamArray) => T;
  readonly map: (param: ScriptBuilderParamMap) => T;
  readonly uInt160: (param: UInt160) => T;
  readonly uInt256: (param: UInt256) => T;
  readonly ecPoint: (param: ECPoint) => T;
  readonly bn: (param: BN) => T;
  readonly number: (param: number) => T;
  readonly string: (param: string) => T;
  readonly boolean: (param: boolean) => T;
  readonly buffer: (param: Buffer) => T;
  readonly object: (param: ScriptBuilderParamObject) => T;
}

export interface ParamArray extends Array<Param> {}
export interface ParamMap extends Map<Param, Param> {}
export interface ParamObject {
  readonly [key: string]: Param;
}
/**
 * Valid parameter types for a smart contract method.
 */
export type Param =
  | undefined
  | BigNumber
  | string
  | BufferString
  | AddressString
  | Hash256String
  | PublicKeyString
  | boolean
  | ParamArray
  | ParamMap
  | ParamObject
  | ForwardValue;

export interface ParamToCallbacks<T> {
  readonly undefined: () => T;
  readonly bigNumber: (param: BigNumber) => T;
  readonly string: (param: string) => T;
  readonly boolean: (param: boolean) => T;
  readonly array: (param: ParamArray) => T;
  readonly map: (param: ParamMap) => T;
  readonly object: (param: ParamObject) => T;
  readonly forwardValue: (param: ForwardValue) => T;
}

export interface ReturnArray extends ReadonlyArray<Return> {}
export interface ReturnMap extends ReadonlyMap<Return, Return> {}
export interface ReturnObject {
  readonly [key: string]: Return;
}
/**
 * Possible return types for a smart contract method.
 */
export type Return =
  | undefined
  | BigNumber
  | BufferString
  | AddressString
  | Hash256String
  | PublicKeyString
  | boolean
  | ReturnArray
  | ReturnMap
  | ReturnObject
  | ContractParameter;

/**
 * Attributes of a deployed smart contract.
 */
export interface Contract {
  /**
   * The `Contract`s ID.
   */
  readonly id: number;
  /**
   * `Contract` code.
   */
  readonly script: BufferString;
  /**
   * The `Contract`'s manifest.
   */
  readonly manifest: ContractManifest;
  /**
   * True if the `Contract` modified blockchain storage.
   */
  readonly hasStorage: boolean;
  /**
   * True if the `Contract` can receive native assets.
   */
  readonly payable: boolean;
}

/* BEGIN LOW-LEVEL API */

/**
 * Describes the details of a contract parameter.
 */
export interface ContractParameterDefinition {
  /**
   * The type of the contract parameter. See `ContractParameterType` for information on possible contract parameter types.
   */
  readonly type: ContractParameter['type'];
  // /**
  //  * The name of the contract parameter.
  //  */
  readonly name: string;
}

/**
 * Invocation stack item for an `Any`.
 *
 * @see ContractParameter
 */
export interface AnyContractParameter extends ContractParameterDefinition {
  /**
   * `type` distinguishes `AnyContractParemeter` from other `ContractParameter` object types.
   */
  readonly type: 'Any';
  /**
   * Value is not defined.
   */
  readonly value: undefined;
}
/**
 * Invocation stack item for a `Signature`.
 *
 * @see ContractParameter
 * @see SignatureString
 */
export interface SignatureContractParameter extends ContractParameterDefinition {
  /**
   * `type` distinguishes `SignatureContractParameter` from other `ContractParameter` object types.
   */
  readonly type: 'Signature';
  /**
   * Raw signature string.
   */
  readonly value: SignatureString;
}

/**
 * Invocation stack item for a `boolean`.
 *
 * @see ContractParameter
 */
export interface BooleanContractParameter extends ContractParameterDefinition {
  /**
   * `type` distinguishes `BooleanContractParameter` from other `ContractParameter` object types.
   */
  readonly type: 'Boolean';
  /**
   * Raw boolean value.
   */
  readonly value: boolean;
}

/**
 * Invocation stack item for a `BN`.
 *
 * Note that unlike most of the client APIs, we use a `BN` instead of a `BigNumber` here to indicate that this is an integer value.
 * For example, an `IntegerContractParameter` that represents a NEO value of 10 would be a `new BN(10_00000000)`.
 *
 * @see ContractParameter
 */
export interface IntegerContractParameter extends ContractParameterDefinition {
  /**
   * `type` distinguishes `IntegerContractParameter` from other `ContractParameter` object types.
   */
  readonly type: 'Integer';
  /**
   * Always an integer. This value is processed using the ABI's `decimals` specification into a corresponding `BigNumber`.
   */
  readonly value: BN;
}

/**
 * Invocation stack item for a `Hash160`.
 *
 * @see ContractParameter
 * @see UInt160
 */
export interface Hash160ContractParameter extends ContractParameterDefinition {
  /**
   * `type` distinguishes `Hash160ContractParameter` from other `ContractParameter` object types.
   */
  readonly type: 'Hash160';
  /**
   * NEO address in base58 encoded string format.
   */
  readonly value: AddressString;
}

/**
 * Invocation stack item for a `Hash256`.
 *
 * @see ContractParameter
 * @see Hash256String
 */
export interface Hash256ContractParameter extends ContractParameterDefinition {
  /**
   * `type` distinguishes `Hash256ContractParameter` from other `ContractParameter` object types.
   */
  readonly type: 'Hash256';
  /**
   * NEO `Hash256` encoded as a string.
   */
  readonly value: Hash256String;
}

/**
 * Invocation stack item for a `Buffer`.
 *
 * @see ContractParameter
 * @see BufferString
 */
export interface BufferContractParameter extends ContractParameterDefinition {
  /**
   * `type` distinguishes `BufferContractParameter` from other `ContractParameter` object types.
   */
  readonly type: 'Buffer';
  /**
   * Hex encoded `Buffer` string.
   */
  readonly value: BufferString;
}

/**
 * Invocation stack item for a `PublicKey`.
 *
 * @see ContractParameter
 * @see PublicKeyString
 */
export interface PublicKeyContractParameter extends ContractParameterDefinition {
  /**
   * `type` distinguishes `PublicKeyContractParameter` from other `ContractParameter` object types.
   */
  readonly type: 'PublicKey';
  /**
   * String format of a public key.
   */
  readonly value: PublicKeyString;
}

/**
 * Invocation stack item for a `string`.
 *
 * @see ContractParameter
 */
export interface StringContractParameter extends ContractParameterDefinition {
  /**
   * `type` distinguishes `StringContractParameter` from other `ContractParameter` object types.
   */
  readonly type: 'String';
  /**
   * Raw string value.
   */
  readonly value: string;
}

/**
 * Invocation stack item for an `Array`.
 *
 * @see ContractParameter
 */
export interface ArrayContractParameter extends ContractParameterDefinition {
  /**
   * `type` distinguishes `ArrayContractParameter` from other `ContractParameter` object types.
   */
  readonly type: 'Array';
  /**
   * An array of `ContractParameter`s.
   */
  readonly value: readonly ContractParameter[];
}

/**
 * Invocation stack item for a `Map`.
 *
 * @see ContractParameter
 */
export interface MapContractParameter extends ContractParameterDefinition {
  /**
   * `type` distinguishes `MapContractParameter` from other `ContractParameter` object types.
   */
  readonly type: 'Map';
  /**
   * A map of `ContractParameter` to `ContractParameter`. Represented as an array of pairs because JavaScript `Map` keys do not have the same semantics as the NEO VM.
   */
  readonly value: ReadonlyArray<readonly [ContractParameter, ContractParameter]>;
}

/**
 * Invocation stack item for anything other than the other valid contract parameters.
 *
 * Examples include the `Block` builtin. If these builtins remain on the stack after invocation, for example, as a return value, then they will be serialized as this empty interface.
 *
 * @see ContractParameter
 */
export interface InteropInterfaceContractParameter extends ContractParameterDefinition {
  /**
   * `type` distinguishes `InteropInterfaceContractParameter` from other `ContractParameter` object types.
   */
  readonly type: 'InteropInterface';
}

/**
 * Invocation stack item for `void`.
 *
 * @see ContractParameter
 */
export interface VoidContractParameter extends ContractParameterDefinition {
  /**
   * `type` distinguishes `VoidContractParameter` from other `ContractParameter` object types.
   */
  readonly type: 'Void';
}

/**
 * `ContractParameter`s are the serialized stack items of an invocation. These are typically the raw results of an invocation, but they may appear in other raw contexts.
 *
 * Low-level API for advanced usage only.
 */
export type ContractParameter =
  | AnyContractParameter
  | SignatureContractParameter
  | BooleanContractParameter
  | IntegerContractParameter
  | Hash160ContractParameter
  | Hash256ContractParameter
  | BufferContractParameter
  | PublicKeyContractParameter
  | StringContractParameter
  | ArrayContractParameter
  | MapContractParameter
  | InteropInterfaceContractParameter
  | VoidContractParameter;

/**
 * All of the possible `type`s that a `ContractParameter` may have.
 * Can be either: `Any`, `Boolean`, `Integer`, `ByteArray`, `String`, `Hash160`, `Hash256`, `PublicKey`, `Signature`,
 * `Array`, `Map`, `InteropInterface`, or `Void`.
 */
export type ContractParameterType = ContractParameter['type'];

/**
 * Raw result of a successful invocation.
 *
 * Low-level API for advanced usage only.
 */
export interface RawTransactionResultSuccess extends RawTransactionResultBase {
  /**
   * Indicates a successful invocation.
   */
  readonly state: 'HALT';
  /**
   * The state of the NEO VM after execution. Typically has one `ContractParameter` which is the return value of the method invoked.
   */
  readonly stack: readonly ContractParameter[];
}

/**
 * Raw result of a failed invocation.
 *
 * Low-level API for advanced usage only.
 */
export interface RawTransactionResultError extends RawTransactionResultBase {
  /**
   * Indicates a failed invocation.
   */
  readonly state: 'FAULT';
  /**
   * The state of the NEO VM after execution. Typically has one `ContractParameter` which is the return value of the method invoked.
   */
  readonly stack: readonly ContractParameter[];
  /**
   * A descriptive message indicating why the invocation failed.
   */
  readonly message: string;
}

/**
 * Raw result of an invocation.
 *
 * Low-level API for advanced usage only.
 */
export type RawInvocationResult = RawTransactionResultSuccess | RawTransactionResultError;

/**
 * Base properties of `Event`s and `Log`s as well as their raw counterparts, `RawNotification` and `RawLog`, respectively.
 */
export interface RawActionBase {
  /**
   * NEO network version number.
   */
  readonly version: number;
  /**
   * Index of the block this action was emitted in.
   */
  readonly blockIndex: number;
  /**
   * Hash of the block this action was emitted in.
   */
  readonly blockHash: Hash256String;
  /**
   * Index of the transaction within the block this action was emitted in.
   */
  readonly transactionIndex: number;
  /**
   * Hash of the transaction within the block this action was emitted in.
   */
  readonly transactionHash: Hash256String;
  /**
   * Ordered index of the action of when it occurred within the transaction.
   */
  readonly index: number;
  /**
   * Ordered globally unique index of the action.
   */
  readonly globalIndex: BigNumber;
  /**
   * Address of the smart contract that this action occurred in.
   */
  readonly address: AddressString;
}

/**
 * Raw notification emitted during an invocation. This is the unprocessed counterpart to an `Event`.
 *
 * Low-level API for advanced usage only.
 */
export interface RawNotification extends RawActionBase {
  /**
   * `type` differentiates the `RawNotification` object from other `RawAction` objects, i.e. `RawLog`.
   */
  readonly type: 'Notification';
  /**
   * The raw arguments of the notifications. These are processed into the `parameters` parameter of the `Event` object using the `ABI`.
   */
  readonly args: readonly ContractParameter[];
}

/**
 * Raw log emitted during an invocation.
 *
 * Low-level API for advanced usage only.
 */
export interface RawLog extends RawActionBase {
  /**
   * `type` differentiates the `RawLog` object from other `RawAction` objects, i.e. `RawNotification`.
   */
  readonly type: 'Log';
  /**
   * The raw message. This is unprocessed in the `message`.
   */
  readonly message: string;
}

/**
 * Raw action emitted during an invocation.
 *
 * Low-level API for advanced usage only.
 */
export type RawAction = RawNotification | RawLog;

/**
 * Base properties of `RawStorageChange`s.
 */
export interface RawStorageChangeBase {
  /**
   * Address of the smart contract whose storage changed.
   */
  readonly address: AddressString;
  /**
   * Key of the storage change.
   */
  readonly key: BufferString;
}

/**
 * Common properties of `RawStorageChangeAdd` and `RawStorageChangeModify`.
 */
export interface RawStorageChangeAddModifyBase extends RawStorageChangeBase {
  /**
   * Value of the storage change.
   */
  readonly value: BufferString;
}

/**
 * Raw storage addition during an invocation.
 *
 * Low-level API for advanced usage only.
 */
export interface RawStorageChangeAdd extends RawStorageChangeAddModifyBase {
  /**
   * `type` differentiates the `RawStorageChangeAdd` object from other `RawStorageChange` objects.
   */
  readonly type: 'Add';
}

/**
 * Raw storage modification during an invocation.
 *
 * Low-level API for advanced usage only.
 */
export interface RawStorageChangeModify extends RawStorageChangeAddModifyBase {
  /**
   * `type` differentiates the `RawStorageChangeModify` object from other `RawStorageChange` objects.
   */
  readonly type: 'Modify';
}

/**
 * Raw storage deletion during an invocation.
 *
 * Low-level API for advanced usage only.
 */
export interface RawStorageChangeDelete extends RawStorageChangeBase {
  /**
   * `type` differentiates the `RawStorageChangeDelete` object from other `RawStorageChange` objects.
   */
  readonly type: 'Delete';
}

/**
 * Raw storage change which occurred an invocation.
 *
 * Low-level API for advanced usage only.
 */
export type RawStorageChange = RawStorageChangeAdd | RawStorageChangeModify | RawStorageChangeDelete;

/**
 * Raw receipt of an invocation.
 *
 * Low-level API for advanced usage only.
 */
export interface RawCallReceipt {
  readonly state: keyof typeof VMState;
  readonly script: Buffer;
  readonly gasConsumed: number;
  readonly stack: readonly RawStackItem[] | string;
  readonly notifications: readonly NewRawNotification[];
}

/**
 * Raw stack item.
 *
 * Low-level API for advanced usage only.
 */
export interface RawStackItem {
  readonly type: string;
  readonly value:
    | boolean
    | Buffer
    | string
    | undefined
    | BigNumber
    | number
    | Map<RawStackItem, RawStackItem>
    | ReadonlyArray<RawStackItem>;
}

/**
 * Raw notification from VM execution.
 *
 * Low-level API for advanced usage only.
 */
export interface NewRawNotification {
  readonly scriptHash: UInt160;
  readonly eventName: string;
  readonly state: readonly RawStackItem[];
  // readonly scriptContainer: any;
}

/**
 * Raw receipt of an invocation.
 *
 * Low-level API for advanced usage only.
 */
export interface RawInvokeReceipt extends TransactionReceipt {
  readonly result: RawInvocationResult;
  readonly actions: readonly RawAction[];
}

/**
 * Smart contract source maps.
 */
export interface SourceMaps {
  /**
   * `RawSourceMap` for the contract at `address`
   */
  readonly [address: string]: RawSourceMap;
}

/**
 * Encodes an error returned by the JSONRPC server.
 */
export interface JSONRPCErrorResponse {
  /**
   * Error code.
   */
  readonly code: number;
  /**
   * Error message.
   */
  readonly message: string;
  /**
   * Additional data, typically `undefined`.
   */
  readonly data?: any;
}

/**
 * An individual verification and the associated data.
 */
export interface VerifyScriptResult {
  /**
   * `undefined` if the verification passed, otherwise a message that describes the failure.
   */
  readonly failureMessage?: string;
  /**
   * The smart contract this result is associated with.
   */
  readonly address: AddressString;
  /**
   * The specific `Witness` that was checked.
   */
  readonly witness: Witness;
  /**
   * The actions emitted during the verification.
   */
  readonly actions: readonly RawAction[];
}

/**
 * Interface which describes the result of verification invocation.
 */
export interface VerifyTransactionResult {
  /**
   * All verifications that happened during the relay of the `Transaction`.
   */
  readonly verifications: readonly VerifyScriptResult[];
}

/**
 * Raw result of relaying a `Transaction`. Further consumed and processed by `LocalUserAccountProvider` and `ABI`.
 */
export interface RelayTransactionResult {
  /**
   * Relayed `Transaction`
   */
  readonly transaction: Transaction;
  /**
   * Verification result.
   */
  readonly verifyResult?: VerifyTransactionResult;
}

/**
 * Additional raw data that is typically processed by an `ABI` for the client APIs.
 */
export interface RawInvocationData {
  /**
   * `Contract`s created by the invocation.
   */
  readonly contracts: readonly Contract[];
  /**
   * `Contract`s deleted by the invocation.
   */
  readonly deletedContractAddresses: readonly AddressString[];
  /**
   * `Contract`s migrated (upgraded) by the invocation.
   */
  readonly migratedContractAddresses: ReadonlyArray<readonly [AddressString, AddressString]>;
  /**
   * Raw result of an invocation.
   */
  readonly result: RawInvocationResult;
  /**
   * Raw actions emitted by the invocation.
   */
  readonly actions: readonly RawAction[];
  /**
   * Storage changes that occurred during this invocation
   */
  readonly storageChanges: readonly RawStorageChange[];
}

export interface ParamJSONArray extends ReadonlyArray<ParamJSON> {}
/**
 * JSON format of `Param`s that are added as an `Attribute` tag.
 */
export type ParamJSON =
  | undefined
  | string
  | BufferString
  | AddressString
  | Hash256String
  | PublicKeyString
  | boolean
  | ParamJSONArray;

/**
 * Constant settings used to initialize the client APIs.
 */
export interface NetworkSettings {
  readonly issueGASFee: BigNumber;
}

/**
 * Peers connected to the node.
 */
export interface Peer {
  readonly address: string;
  readonly port: number;
}

/**
 * Raw storage value
 */
export interface StorageItem {
  readonly address: string;
  readonly key: string;
  readonly value: string;
}

/* END LOW-LEVEL API */
