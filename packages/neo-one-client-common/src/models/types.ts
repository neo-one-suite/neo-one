import { JSONObject } from '@neo-one/utils';
import { UInt256Hex } from '../common';
import { ContractParameterTypeModel } from './ContractParameterTypeModel';
import { StorageFlagsModel } from './StorageFlagsModel';
import { AttributeTypeModel } from './transaction/attribute/AttributeTypeModel';
import { VerifyResultModel } from './VerifyResultModel';
import { VMState, VMStateJSON } from './vm';
import { WitnessScopeModel } from './WitnessScopeModel';

export interface ContractParameterDefinitionJSON {
  readonly type: keyof typeof ContractParameterTypeModel;
  readonly name: string;
}

export interface AnyContractParameterJSON extends ContractParameterDefinitionJSON {
  readonly type: 'Any';
  readonly value: undefined;
}

export interface ArrayContractParameterJSON extends ContractParameterDefinitionJSON {
  readonly type: 'Array';
  readonly value: readonly ContractParameterJSON[];
}

export interface BooleanContractParameterJSON extends ContractParameterDefinitionJSON {
  readonly type: 'Boolean';
  readonly value: boolean;
}

export interface ByteArrayContractParameterJSON extends ContractParameterDefinitionJSON {
  readonly type: 'ByteArray';
  readonly value: string;
}

export interface Hash160ContractParameterJSON extends ContractParameterDefinitionJSON {
  readonly type: 'Hash160';
  readonly value: string;
}

export interface Hash256ContractParameterJSON extends ContractParameterDefinitionJSON {
  readonly type: 'Hash256';
  readonly value: string;
}

export interface IntegerContractParameterJSON extends ContractParameterDefinitionJSON {
  readonly type: 'Integer';
  readonly value: string;
}

export interface InteropInterfaceContractParameterJSON extends ContractParameterDefinitionJSON {
  readonly type: 'InteropInterface';
}

export interface MapContractParameterJSON extends ContractParameterDefinitionJSON {
  readonly type: 'Map';
  readonly value: ReadonlyArray<readonly [ContractParameterJSON, ContractParameterJSON]>;
}

export interface PublicKeyContractParameterJSON extends ContractParameterDefinitionJSON {
  readonly type: 'PublicKey';
  readonly value: string;
}

export interface SignatureContractParameterJSON extends ContractParameterDefinitionJSON {
  readonly type: 'Signature';
  readonly value: string;
}

export interface StringContractParameterJSON extends ContractParameterDefinitionJSON {
  readonly type: 'String';
  readonly value: string;
}

export interface VoidContractParameterJSON extends ContractParameterDefinitionJSON {
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

export type WitnessScopeJSON = keyof typeof WitnessScopeModel;

export interface TransactionResultErrorJSON {
  readonly state: 'FAULT';
  readonly gas_consumed: string;
  readonly gas_cost: string;
  readonly stack: readonly ContractParameterJSON[];
  readonly script: string;
  readonly message: string;
}

export interface TransactionResultSuccessJSON {
  readonly state: 'HALT';
  readonly gas_consumed: string;
  readonly gas_cost: string; // TODO: not sure if this is redundant or not
  readonly stack: readonly ContractParameterJSON[];
  readonly script: string;
}

export type InvocationResultJSON = TransactionResultSuccessJSON | TransactionResultErrorJSON;

export interface RawInvocationResultErrorJSON {
  readonly state: 'FAULT';
  readonly gas_consumed: string;
  readonly stack: readonly ContractParameterJSON[];
}

export interface RawInvocationResultSuccessJSON {
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

export interface AttributeJSON {
  readonly type: AttributeTypeJSON;
}

export type AttributeTypeJSON = keyof typeof AttributeTypeModel;

export type VerifyResultJSON = keyof typeof VerifyResultModel;

// TODO: what extra invocation data are we going to include now?
export interface InvocationDataJSON {
  readonly result: InvocationResultJSON;
  // readonly asset?: AssetJSON;
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

// TODO: not sure if we need this
export interface StateItemJSON {
  readonly type: string;
  readonly value: string;
}

// TODO: not sure if we need this
export interface NeoNotificationJSON {
  readonly contract: string;
  readonly state: {
    readonly type: string;
    readonly value: readonly StateItemJSON[];
  };
}

export interface StackItemJSONBase {
  readonly type: StackItemJSON['type'];
  // readonly value:
  //   | string
  //   | number
  //   | boolean
  //   | readonly StackItemJSON[]
  //   | undefined
  //   | ReadonlyArray<{ readonly key: PrimitiveStackItemJSON; readonly value: StackItemJSON }>;
}

export interface AnyStackItemJSON extends StackItemJSONBase {
  readonly type: 'Any';
  readonly value: undefined;
}

export interface PointerStackItemJSON extends StackItemJSONBase {
  readonly type: 'Pointer';
  readonly value: number;
}

export interface BooleanStackItemJSON extends StackItemJSONBase {
  readonly type: 'Boolean';
  readonly value: boolean;
}

export interface IntegerStackItemJSON extends StackItemJSONBase {
  readonly type: 'Integer';
  readonly value: string;
}

export interface ByteStringStackItemJSON extends StackItemJSONBase {
  readonly type: 'ByteString';
  readonly value: string;
}

export interface BufferStackItemJSON extends StackItemJSONBase {
  readonly type: 'Buffer';
  readonly value: string;
}

export interface ArrayStackItemJSON extends StackItemJSONBase {
  readonly type: 'Array';
  readonly value: readonly StackItemJSON[];
}

export interface MapStackItemJSON extends StackItemJSONBase {
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
  // | StructStackItemJSON
  | MapStackItemJSON;
// | InteropInterfaceStackItemJSON;

// TODO: copy pasted from node-core. We might want to put this here instead
export enum TriggerType {
  Verification = 0x00,
  System = 0x01,
  Application = 0x10,
}

export interface ExecutionResultJSON {
  readonly trigger: keyof typeof TriggerType;
  readonly contract: string;
  readonly vmstate: keyof typeof VMState;
  readonly gas_consumed: string;
  readonly stack: readonly StackItemJSON[];
  readonly notifications: readonly NotificationActionJSON[];
}

export interface ApplicationLogDataJSON {
  readonly txid: string;
  readonly executions: readonly ExecutionResultJSON[];
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
  readonly blockhash: string;
  readonly confirmations: number;
  readonly blocktime: string;
  readonly vmstate: string;
}

// Just for Neo returns, don't think we need it for anything
export interface VerboseTransactionJSON extends TransactionJSON {
  readonly blockhash: UInt256Hex;
  readonly confirmations: number;
  readonly blocktime: string;
  readonly vmstate: VMStateJSON;
}

export interface TransactionWithInvocationDataJSON extends TransactionJSON {
  readonly script: string;
  readonly gas: string;
  readonly invocationData?: InvocationDataJSON | undefined;
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
  readonly hashOrGroup: string;
  readonly isHash: boolean;
  readonly isGroup: boolean;
  readonly isWildcard: boolean;
}

export interface ContractPermissionJSON {
  readonly contract: ContractPermissionDescriptorJSON;
  readonly methods: WildcardContainerJSON;
}

export interface ContractManifestJSON {
  readonly hash: string;
  // TODO: only hash is included in old `ContractJSON` definition. Remove hashHex?
  readonly hashHex: string;
  readonly abi: ContractABIJSON;
  readonly groups: readonly ContractGroupJSON[];
  readonly permissions: readonly ContractPermissionJSON[];
  readonly trusts: WildcardContainerJSON;
  readonly safemethods: WildcardContainerJSON;
  readonly features: {
    readonly storage: boolean;
    readonly payable: boolean;
  };
  readonly supportedstandards: readonly string[];
  readonly extra?: JSONObject;
}

export interface ContractParameterDefinitionJSON {
  readonly name: string;
  readonly type: ContractParameterTypeJSON;
}

export interface ContractJSON {
  readonly id: number;
  readonly script: string;
  readonly manifest: ContractManifestJSON;
  readonly hasStorage: boolean;
  readonly payable: boolean;
}

export interface Nep5TransfersJSON {
  readonly address: string;
  readonly received: readonly Nep5TransferJSON[];
  readonly sent: readonly Nep5TransferJSON[];
}

export interface Nep5BalancesJSON {
  readonly address: string;
  readonly balance: readonly Nep5BalanceJSON[];
}

export interface Nep5BalanceJSON {
  readonly assethash: string;
  readonly amount: string;
  readonly lastupdatedblock: number;
}

export interface Nep5TransferJSON {
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
  readonly time: string;
  readonly index: number;
  readonly nextconsensus: string;
  readonly nextblockhash?: string;
  readonly witnesses: readonly WitnessJSON[];
  readonly hash: string;
  readonly size: number;
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
  readonly issueGASFee: string;
}

// export interface CallReceiptJSON {
//   readonly result: InvocationResultJSON;
//   readonly actions: readonly ActionJSON[];
// }

export interface NotificationJSON {
  // readonly scriptcontainer: SerializedScriptContainerJSON;
  readonly scripthash: string;
  readonly eventname: string;
  readonly state: readonly StackItemJSON[];
}

export interface CallReceiptJSON {
  readonly script: string;
  readonly state: keyof typeof VMState;
  readonly gasconsumed: number;
  readonly stack: readonly StackItemJSON[] | string;
  readonly notifications: readonly NotificationJSON[];
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

export interface ValidatorJSON {
  readonly active: boolean;
  readonly publicKey: string;
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
