import { SignatureString } from '../types';
import { ContractParameterTypeModel } from './ContractParameterTypeModel';
import { StorageFlagsModel } from './StorageFlagsModel';
import { AttributeTypeModel } from './transaction/attribute/AttributeTypeModel';
import { VerifyResultModel } from './VerifyResultModel';
import { VMState } from './vm';
import { WitnessScopeModel } from './WitnessScopeModel';

export interface ContractParameterDefinitionJSON {
  readonly type: keyof typeof ContractParameterTypeModel;
  readonly name: string;
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

// TODO: rename to "TransactionResultErrorJSON" ?
export interface InvocationResultErrorJSON {
  readonly state: VMState.FAULT;
  readonly gas_consumed: string;
  readonly gas_cost: string;
  readonly stack: readonly ContractParameterJSON[];
  readonly script: string;
}

// TODO: rename to "TransactionResultSuccessJSON" ?
export interface InvocationResultSuccessJSON {
  readonly state: VMState.HALT;
  readonly gas_consumed: string;
  // readonly gas_cost: string; // TODO: check that this should be removed
  readonly stack: readonly ContractParameterJSON[];
  readonly script: string; // TODO: check this
}

export type InvocationResultJSON = InvocationResultSuccessJSON | InvocationResultErrorJSON;

export interface RawInvocationResultErrorJSON {
  readonly state: 'FAULT';
  readonly gas_consumed: string;
  readonly stack: readonly ContractParameterJSON[];
}

export interface RawInvocationResultSuccessJSON {
  readonly state: 'HALT';
  readonly gas_consumed: string;
  readonly stack: readonly ContractParameterJSON[];
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

export interface TransactionWithInvocationDataJSON extends TransactionJSON {
  readonly script: string;
  readonly gas: string;
  readonly invocationData?: InvocationDataJSON | undefined;
}

export interface TransactionReceiptJSON {
  readonly blockIndex: number;
  readonly blockHash: string;
  readonly transactionIndex: number;
  readonly globalIndex: string;
}

export interface ConfirmedTransactionJSON extends TransactionJSON, TransactionReceiptJSON {}

export type Wildcard = '*';
export type WildcardContainerJSON = readonly string[] | Wildcard;

export interface ContractMethodDescriptorJSON {
  readonly name: string;
  readonly parameters: readonly ContractParameterDefinitionJSON[];
  readonly offset: number;
  readonly returnType: ContractParameterTypeJSON;
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
  readonly signature: SignatureString;
}

export type ContractPermissionDescriptorJSON = string;

export interface ContractPermissionJSON {
  readonly contract: ContractPermissionDescriptorJSON;
  readonly methods: WildcardContainerJSON;
}

type ExtraValue = string | number | boolean | readonly ExtraValue[];
export interface Extra {
  readonly [k: string]: ExtraValue | Extra;
}

export interface ContractManifestJSON {
  readonly abi: ContractABIJSON;
  readonly groups: readonly ContractGroupJSON[];
  readonly permissions: readonly ContractPermissionJSON[];
  readonly trusts: WildcardContainerJSON;
  readonly safeMethods: WildcardContainerJSON;
  readonly features: {
    readonly storage: boolean;
    readonly payable: boolean;
  };
  readonly supportedStandards: readonly string[];
  readonly extra?: Extra;
}

export interface ContractParameterDefinitionJSON {
  readonly name: string;
  readonly type: ContractParameterTypeJSON;
}

export interface ContractJSON {
  readonly id: number;
  readonly hash: string;
  readonly script: string;
  readonly manifest: ContractManifestJSON;
}

export interface BlockBaseJSON {
  readonly hash: string;
  readonly size: number;
  readonly version: number;
  readonly previousblockhash: string;
  readonly merkleroot: string;
  readonly time: string;
  readonly index: number;
  readonly nextconsensus: string;
  readonly witnesses: readonly WitnessJSON[];
  // TODO: confirmations: number;
  // TODO: nextblockhash?: string;
}

export interface ConsensusDataJSON {
  readonly primary: number;
  readonly nonce: string;
}

export interface HeaderJSON extends BlockBaseJSON {}

export interface BlockJSON extends BlockBaseJSON {
  // TODO: this used to be `ConfirmedTransactionJSON[]`. Why?
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

export interface CallReceiptJSON {
  readonly result: InvocationResultJSON;
  readonly actions: readonly ActionJSON[];
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
  readonly verifyResult?: VerifyTransactionResultJSON;
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
  readonly tcpPort: number;
  readonly wsPort: number;
  readonly nonce: number;
  readonly useragent: string;
}

export interface NeoClaimableJSON {
  readonly claimable: readonly NeoInputClaimableJSON[];
  readonly unclaimed: string;
  readonly address: string;
}

export interface NeoInputClaimableJSON {
  readonly txid: string;
  readonly n: number;
  readonly value: string;
  readonly start_height: number;
  readonly end_height: number;
  readonly generated: string;
  readonly sys_fee: string;
  readonly unclaimed: string;
}

export interface NeoUnspentOutputJSON {
  readonly txid: string;
  readonly n: number;
  readonly value: string;
}

export interface NeoBalanceJSON {
  readonly unspent: readonly NeoUnspentOutputJSON[];
  readonly asset_hash: string;
  readonly asset: string;
  readonly asset_symbol: string;
  readonly amount: string;
}

export interface NeoUnspentJSON {
  readonly balance: readonly NeoBalanceJSON[];
  readonly address: string;
}

export interface NeoPreviewContractJSON {
  readonly name: string;
  readonly version: string;
  readonly author: string;
  readonly email: string;
  readonly description: string;
  readonly code: {
    readonly hash: string;
    readonly script: string;
    readonly parameters: readonly ContractParameterTypeJSON[];
    readonly returntype: ContractParameterTypeJSON;
  };
  readonly needstorage: boolean;
}
