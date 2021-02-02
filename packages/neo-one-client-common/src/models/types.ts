import { JSONObject } from '@neo-one/utils';
import { UInt256Hex } from '../common';
import { UserAccount } from '../types';
import { ContractParameterTypeModel } from './ContractParameterTypeModel';
import { StorageFlagsModel } from './StorageFlagsModel';
import { AttributeTypeModel } from './transaction';
import { TriggerType, TriggerTypeJSON } from './trigger';
import { VerifyResultModel } from './VerifyResultModel';
import { VMState, VMStateJSON } from './vm';
import { WitnessScopeModel } from './WitnessScopeModel';

export interface AnyContractParameterJSON {
  readonly type: 'Any';
  readonly value: undefined;
}

export interface ArrayContractParameterJSON {
  readonly type: 'Array';
  readonly value: readonly ContractParameterJSON[];
}

export interface BooleanContractParameterJSON {
  readonly type: 'Boolean';
  readonly value: boolean;
}

export interface ByteArrayContractParameterJSON {
  readonly type: 'ByteArray';
  readonly value: string;
}

export interface Hash160ContractParameterJSON {
  readonly type: 'Hash160';
  readonly value: string;
}

export interface Hash256ContractParameterJSON {
  readonly type: 'Hash256';
  readonly value: string;
}

export interface IntegerContractParameterJSON {
  readonly type: 'Integer';
  readonly value: string;
}

export interface InteropInterfaceContractParameterJSON {
  readonly type: 'InteropInterface';
}

export interface MapContractParameterJSON {
  readonly type: 'Map';
  readonly value: ReadonlyArray<readonly [ContractParameterJSON, ContractParameterJSON]>;
}

export interface PublicKeyContractParameterJSON {
  readonly type: 'PublicKey';
  readonly value: string;
}

export interface SignatureContractParameterJSON {
  readonly type: 'Signature';
  readonly value: string;
}

export interface StringContractParameterJSON {
  readonly type: 'String';
  readonly value: string;
}

export interface VoidContractParameterJSON {
  readonly type: 'Void';
}

export type ContractParameterJSON =
  | AnyContractParameterJSON
  | SignatureContractParameterJSON
  | BooleanContractParameterJSON
  | IntegerContractParameterJSON
  | Hash160ContractParameterJSON
  | Hash256ContractParameterJSON
  | ByteArrayContractParameterJSON
  | MapContractParameterJSON
  | PublicKeyContractParameterJSON
  | StringContractParameterJSON
  | ArrayContractParameterJSON
  | InteropInterfaceContractParameterJSON
  | VoidContractParameterJSON;

export type ContractParameterTypeJSON = keyof typeof ContractParameterTypeModel;

export interface AnyStackItemJSON {
  readonly type: 'Any';
  readonly value: undefined;
}

export interface PointerStackItemJSON {
  readonly type: 'Pointer';
  readonly value: number;
}

export interface BooleanStackItemJSON {
  readonly type: 'Boolean';
  readonly value: boolean;
}

export interface IntegerStackItemJSON {
  readonly type: 'Integer';
  readonly value: string;
}

export interface ByteStringStackItemJSON {
  readonly type: 'ByteString';
  readonly value: string;
}

export interface BufferStackItemJSON {
  readonly type: 'Buffer';
  readonly value: string;
}

export interface ArrayStackItemJSON {
  readonly type: 'Array';
  readonly value: readonly StackItemJSON[];
}

export interface MapStackItemJSON {
  readonly type: 'Map';
  readonly value: ReadonlyArray<{ readonly key: PrimitiveStackItemJSON; readonly value: StackItemJSON }>;
}

export type PrimitiveStackItemJSON = BooleanStackItemJSON | IntegerStackItemJSON | ByteStringStackItemJSON;

export type StackItemJSON =
  | AnyStackItemJSON
  | PointerStackItemJSON
  | PrimitiveStackItemJSON
  | BufferStackItemJSON
  | ArrayStackItemJSON
  | MapStackItemJSON;

export type WitnessScopeJSON = keyof typeof WitnessScopeModel;

// TODO: delete
export interface TransactionResultErrorJSON {
  readonly state: 'FAULT';
  readonly gas_consumed: string;
  readonly stack: readonly ContractParameterJSON[];
  readonly script: string;
  readonly message: string;
}

export interface TransactionResultSuccessJSON {
  readonly state: 'HALT';
  readonly gas_consumed: string;
  readonly stack: readonly ContractParameterJSON[];
  readonly script: string;
}

export type InvocationResultJSON = TransactionResultSuccessJSON | TransactionResultErrorJSON;

export interface RawInvocationResultErrorJSON {
  readonly script: string;
  readonly state: 'FAULT';
  readonly gasconsumed: string;
  readonly stack: string;
  readonly notifications: readonly NotificationJSON[];
  readonly logs: readonly LogJSON[];
}

export interface RawInvocationResultSuccessJSON {
  readonly script: string;
  readonly state: 'HALT';
  readonly gasconsumed: string;
  readonly stack: readonly ContractParameterJSON[];
  readonly notifications: readonly NotificationJSON[];
}

export type RawInvocationResultJSON = RawInvocationResultSuccessJSON | RawInvocationResultErrorJSON;

export interface StorageChangeAddJSON {
  readonly type: 'Add';
  readonly hash: string;
  readonly key: string;
  readonly value: string;
}

export interface StorageChangeModifyJSON {
  readonly type: 'Modify';
  readonly hash: string;
  readonly key: string;
  readonly value: string;
}

export interface StorageChangeDeleteJSON {
  readonly type: 'Delete';
  readonly hash: string;
  readonly key: string;
}

export type StorageChangeJSON = StorageChangeAddJSON | StorageChangeModifyJSON | StorageChangeDeleteJSON;

export interface ActionBaseJSON {
  readonly version: number;
  readonly index: string;
  readonly scriptHash: string;
}

export interface LogActionJSON extends ActionBaseJSON {
  readonly type: 'Log';
  readonly message: string;
}

export interface NotificationActionJSON extends ActionBaseJSON {
  readonly type: 'Notification';
  readonly args: readonly ContractParameterJSON[];
}

export type ActionJSON = NotificationActionJSON | LogActionJSON;
export type ActionTypeJSON = ActionJSON['type'];

export interface StorageItemJSON {
  readonly hash: string;
  readonly key: string;
  readonly value: string;
  readonly flags: StorageFlagsJSON;
}

export type StorageFlagsJSON = keyof typeof StorageFlagsModel;

export interface WitnessJSON {
  readonly invocation: string;
  readonly verification: string;
}

export interface SignerJSON {
  readonly account: string;
  readonly scopes: WitnessScopeJSON;
  readonly allowedcontracts?: readonly string[];
  readonly allowedgroups?: readonly string[];
}

export interface AttributeJSONBase {
  readonly type: AttributeTypeJSON;
}

export interface HighPriorityAttributeJSON extends AttributeJSONBase {
  readonly type: 'HighPriority';
}

export interface OracleResponseJSON extends AttributeJSONBase {
  readonly type: 'OracleResponse';
  readonly id: string;
  readonly code: number;
  readonly result: string;
}

export type AttributeJSON = HighPriorityAttributeJSON | OracleResponseJSON;

export type AttributeTypeJSON = keyof typeof AttributeTypeModel;

export type VerifyResultJSON = keyof typeof VerifyResultModel;

export interface InvocationDataJSON {
  readonly result: InvocationResultJSON;
  readonly contracts: readonly ContractJSON[];
  readonly deletedContractHashes: readonly string[];
  readonly migratedContractHashes: ReadonlyArray<readonly [string, string]>;
  readonly voteUpdates: ReadonlyArray<readonly [string, ReadonlyArray<string>]>;
  readonly actions: readonly ActionJSON[];
  readonly storageChanges: readonly StorageChangeJSON[];
}

export interface UnclaimedGASJSON {
  readonly unclaimed: string;
  readonly address: string;
}

export interface ExecutionResultJSON {
  readonly trigger: keyof typeof TriggerType;
  readonly contract: string;
  readonly vmstate: keyof typeof VMState;
  readonly gas_consumed: string;
  readonly stack: readonly StackItemJSON[];
  readonly notifications: readonly NotificationActionJSON[];
}

export interface ApplicationLogJSON {
  readonly txid?: string;
  readonly trigger: TriggerTypeJSON;
  readonly vmstate: VMStateJSON;
  readonly gasconsumed: string;
  readonly stack: readonly StackItemJSON[] | string;
  readonly notifications: readonly NotificationJSON[];
  readonly logs: readonly LogJSON[];
}

export interface AccountContractJSON {
  readonly script: string;
  readonly parameterlist: readonly ContractParameterTypeJSON[];
  readonly scripthash: string;
  readonly address: string;
}

export interface TransactionJSON {
  readonly hash: string;
  readonly size: number;
  readonly version: number;
  readonly nonce: number;
  readonly sender?: string;
  readonly sysfee: string;
  readonly netfee: string;
  readonly validuntilblock: number;
  readonly attributes: readonly AttributeJSON[];
  readonly signers: readonly SignerJSON[];
  readonly script: string;
  readonly witnesses: readonly WitnessJSON[];
  readonly receipt?: TransactionReceiptJSON;
}

// Just for Neo returns, don't think we need it for anything
export interface VerboseTransactionJSON extends TransactionJSON {
  readonly blockhash: UInt256Hex;
  readonly confirmations: number;
  readonly blocktime: number;
  readonly vmstate: VMStateJSON;
}

export interface TransactionWithInvocationDataJSON extends TransactionJSON {
  readonly script: string;
  readonly gas: string;
}

export interface TransactionReceiptJSON {
  readonly blockIndex: number;
  readonly blockHash: string;
  readonly globalIndex: string;
  readonly transactionIndex: number;
  readonly blockTime: string;
  readonly confirmations: number;
  readonly transactionHash: string;
}

export type Wildcard = '*';
export type WildcardContainerJSON<TJSON = string> = readonly TJSON[] | Wildcard;

export interface ContractMethodDescriptorJSON {
  readonly name: string;
  readonly parameters: readonly ContractParameterDefinitionJSON[];
  readonly offset: number;
  readonly returntype: ContractParameterTypeJSON;
  readonly safe: boolean;
}

export interface ContractEventDescriptorJSON {
  readonly name: string;
  readonly parameters: readonly ContractParameterDefinitionJSON[];
}

export interface ContractABIJSON {
  readonly hash: string;
  readonly methods: readonly ContractMethodDescriptorJSON[];
  readonly events: readonly ContractEventDescriptorJSON[];
}

export interface ContractGroupJSON {
  readonly publicKey: string;
  readonly signature: string;
}

export interface ContractPermissionDescriptorJSON {
  readonly hash?: string;
  readonly group?: string;
}

export interface ContractPermissionJSON {
  readonly contract: ContractPermissionDescriptorJSON;
  readonly methods: WildcardContainerJSON;
}

export interface ContractManifestJSON {
  readonly abi: ContractABIJSON;
  readonly groups: readonly ContractGroupJSON[];
  readonly permissions: readonly ContractPermissionJSON[];
  readonly trusts: WildcardContainerJSON;
  readonly supportedstandards: readonly string[];
  readonly extra?: JSONObject;
}

export interface ContractParameterDefinitionJSON {
  readonly name: string;
  readonly type: ContractParameterTypeJSON;
}

export interface ContractJSON {
  readonly id: number;
  readonly updatecounter: number;
  readonly hash: string;
  readonly script: string;
  readonly manifest: ContractManifestJSON;
}

export interface Nep17TransfersJSON {
  readonly address: string;
  readonly received: readonly Nep17TransferJSON[];
  readonly sent: readonly Nep17TransferJSON[];
}

export interface Nep17BalancesJSON {
  readonly address: string;
  readonly balance: readonly Nep17BalanceJSON[];
}

export interface Nep17BalanceJSON {
  readonly assethash: string;
  readonly amount: string;
  readonly lastupdatedblock: number;
}

export interface Nep17TransferJSON {
  readonly timestamp: number;
  readonly assethash: string;
  readonly transferaddress: string;
  readonly amount: string;
  readonly blockindex: number;
  readonly transfernotifyindex: number;
  readonly txhash: string;
}

export interface BlockBaseJSON {
  readonly version: number;
  readonly previousblockhash: string;
  readonly merkleroot: string;
  readonly time: number;
  readonly index: number;
  readonly nextconsensus: string;
  readonly nextblockhash?: string;
  readonly witnesses: readonly WitnessJSON[];
  readonly hash: string;
  readonly size: number;
  readonly confirmations?: number;
}

export interface ConsensusDataJSON {
  readonly primary: number;
  readonly nonce: string;
}

export interface HeaderJSON extends BlockBaseJSON {}

export interface BlockJSON extends BlockBaseJSON {
  readonly tx: readonly TransactionJSON[];
  readonly consensusdata?: ConsensusDataJSON;
}

export interface TrimmedBlockJSON extends BlockBaseJSON {
  readonly consensusdata?: ConsensusDataJSON;
  readonly hashes: readonly string[];
}

export interface NetworkSettingsJSON {
  readonly blockcount: number;
  readonly decrementinterval: number;
  readonly generationamount: readonly number[];
  readonly privatekeyversion: number;
  readonly standbyvalidators: readonly string[];
  readonly messagemagic: number;
  readonly addressversion: number;
  readonly standbycommittee: readonly string[];
  readonly committeememberscount: number;
  readonly validatorscount: number;
  readonly millisecondsperblock: number;
  readonly memorypoolmaxtransactions: number;
}

export interface NotificationJSON {
  readonly scripthash: string;
  readonly eventname: string;
  readonly state: readonly ContractParameterJSON[] | string;
}

export interface LogJSON {
  readonly containerhash?: string;
  readonly callingscripthash: string;
  readonly message: string;
  // readonly position: number;
}

export interface CallReceiptJSON {
  readonly script: string;
  readonly state: keyof typeof VMState;
  readonly gasconsumed: string;
  readonly stack: readonly ContractParameterJSON[] | string;
  readonly notifications: readonly NotificationJSON[];
  readonly logs: readonly LogJSON[];
}

export interface VerifyScriptResultJSON {
  readonly failureMessage?: string;
  readonly hash: string;
  readonly witness: WitnessJSON;
  readonly actions: readonly ActionJSON[];
}

export interface VerifyTransactionResultJSON {
  readonly verifications: readonly VerifyScriptResultJSON[];
}

export interface RelayTransactionResultJSON {
  readonly transaction: TransactionJSON;
  // TODO: reimplement the longform verify transaction result
  readonly verifyResult?: VerifyResultJSON;
}

export interface SendRawTransactionResultJSON {
  readonly hash: string;
}

export interface ValidatorJSON {
  readonly active: boolean;
  readonly publickey: string;
  readonly votes: string;
}

export interface PluginJSON {
  readonly name: string;
  readonly version: string;
  readonly interfaces: readonly string[];
}

export interface VersionJSON {
  readonly tcpport: number;
  readonly wsport: number;
  readonly nonce: number;
  readonly useragent: string;
}

export interface VerificationCostJSON {
  readonly fee: string;
  readonly size: number;
}

export interface UserAccountJSON extends Omit<UserAccount, 'contract'> {
  readonly contract: AccountContractJSON;
}
