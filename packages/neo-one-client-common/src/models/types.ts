import { JSONObject } from '@neo-one/utils';
import { UInt256Hex } from '../common';
import { UserAccount } from '../types';
import { ContractParameterTypeModel } from './ContractParameterTypeModel';
import { AttributeTypeModel } from './transaction';
import { TriggerTypeJSON } from './trigger';
import { VerifyResultModel } from './VerifyResultModel';
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
  readonly key: string;
  readonly value: string;
}

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

export interface UnclaimedGASJSON {
  readonly unclaimed: string;
  readonly address: string;
}

export interface ExecutionJSON {
  readonly trigger: TriggerTypeJSON;
  readonly vmstate: 'HALT' | 'FAULT';
  readonly gasconsumed: string;
  readonly exception?: string;
  readonly stack: readonly ContractParameterJSON[] | string;
  readonly notifications: readonly NotificationJSON[];
  readonly logs: readonly LogJSON[];
}

export interface ApplicationLogJSON {
  readonly txid?: string;
  readonly blockhash?: string;
  readonly executions: readonly ExecutionJSON[];
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
}

export interface ConfirmedTransactionJSON extends TransactionJSON {
  readonly receipt: TransactionReceiptJSON;
}

export interface TransactionReceiptJSON {
  readonly blockIndex: number;
  readonly blockHash: UInt256Hex;
  readonly globalIndex: string;
  readonly transactionIndex: number;
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
  readonly name: string;
  readonly abi: ContractABIJSON;
  readonly groups: readonly ContractGroupJSON[];
  readonly permissions: readonly ContractPermissionJSON[];
  readonly trusts: WildcardContainerJSON<ContractPermissionDescriptorJSON>;
  readonly supportedstandards: readonly string[];
  readonly features: JSONObject;
  readonly extra?: JSONObject;
}

export interface ContractParameterDefinitionJSON {
  readonly name: string;
  readonly type: ContractParameterTypeJSON;
}

export interface MethodTokenJSON {
  readonly hash: string;
  readonly method: string;
  readonly paramcount: number;
  readonly hasreturnvalue: boolean;
  readonly callflags: number;
}

export interface NefFileJSON {
  readonly magic: number;
  readonly compiler: string;
  readonly tokens: readonly MethodTokenJSON[];
  readonly script: string;
  readonly checksum: number;
}

export interface ContractJSON {
  readonly id: number;
  readonly updatecounter: number;
  readonly hash: string;
  readonly nef: NefFileJSON;
  readonly manifest: ContractManifestJSON;
}

export interface NativeContractJSON {
  readonly id: number;
  readonly hash: string;
  readonly nef: NefFileJSON;
  readonly manifest: ContractManifestJSON;
  readonly updatehistory: readonly number[];
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

export interface HeaderJSON {
  readonly hash: string;
  readonly size: number;
  readonly version: number;
  readonly previousblockhash: string;
  readonly merkleroot: string;
  readonly time: number;
  readonly nonce: string;
  readonly index: number;
  readonly primary: number;
  readonly nextconsensus: string;
  readonly witnesses: readonly WitnessJSON[];
  readonly nextblockhash?: string;
  readonly confirmations?: number;
}

export interface BlockJSON extends HeaderJSON {
  readonly tx: readonly ConfirmedTransactionJSON[];
}

export interface NetworkSettingsJSON {
  readonly blockcount: number;
  readonly decrementinterval: number;
  readonly generationamount: readonly number[];
  readonly privatekeyversion: number;
  readonly standbyvalidators: readonly string[];
  readonly network: number;
  readonly maxvaliduntilblockincrement: number;
  readonly addressversion: number;
  readonly standbycommittee: readonly string[];
  readonly committeememberscount: number;
  readonly validatorscount: number;
  readonly millisecondsperblock: number;
  readonly memorypoolmaxtransactions: number;
  readonly maxtraceableblocks: number;
  readonly initialgasdistribution: number;
  readonly maxblocksize: number;
  readonly maxblocksystemfee: number;
  readonly maxtransactionsperblock: number;
  readonly nativeupdatehistory: { readonly [key: string]: readonly number[] };
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
  readonly position: number;
}

export interface CallReceiptJSON {
  readonly script: string;
  readonly state: 'HALT' | 'FAULT';
  readonly gasconsumed: string;
  readonly exception?: string;
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

export interface RelayTransactionResultJSON {
  readonly transaction: TransactionJSON;
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
  readonly network: number;
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
