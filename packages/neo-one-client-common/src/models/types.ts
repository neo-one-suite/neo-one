import { AssetTypeModel } from './AssetTypeModel';
import { ContractParameterTypeModel } from './ContractParameterTypeModel';
import { StateDescriptorTypeModel } from './StateDescriptorTypeModel';
import { StorageFlagsModel } from './StorageFlagsModel';
import { AttributeUsageModel } from './transaction';
import { VMState } from './vm';
import { WitnessScopeModel } from './WitnessScopeModel';

export interface AccountJSON {
  readonly version: number;
  readonly script_hash: string;
  readonly frozen: boolean;
  readonly votes: readonly string[];
  readonly balances: ReadonlyArray<{ readonly asset: string; readonly value: string }>;
  readonly unspent: readonly InputJSON[];
  readonly unclaimed: readonly InputJSON[];
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

export interface InvocationResultErrorJSON {
  readonly state: VMState.Fault;
  readonly gas_consumed: string;
  readonly gas_cost: string;
  readonly stack: readonly ContractParameterJSON[];
  readonly message: string;
}

export interface InvocationResultSuccessJSON {
  readonly state: VMState.Halt;
  readonly gas_consumed: string;
  readonly gas_cost: string;
  readonly stack: readonly ContractParameterJSON[];
}

export type InvocationResultJSON = InvocationResultSuccessJSON | InvocationResultErrorJSON;

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

export interface CosignerJSON {
  readonly account: string;
  readonly scopes: WitnessScopeJSON;
  readonly allowedContracts?: readonly string[];
  readonly allowedGroups?: readonly string[];
}

export interface AttributeJSON {
  readonly usage: AttributeUsageJSON;
  readonly data: string;
}

export type AttributeUsageJSON = keyof typeof AttributeUsageModel;

export interface InputJSON {
  readonly txid: string;
  readonly vout: number;
}

export interface OutputJSON {
  readonly n: number;
  readonly asset: string;
  readonly value: string;
  readonly address: string;
}

export interface InvocationDataJSON {
  readonly result: InvocationResultJSON;
  readonly asset?: AssetJSON;
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
  readonly nonce: string;
  readonly sender: string;
  readonly sys_fee: string;
  readonly net_fee: string;
  readonly valid_until_block: number;
  readonly attributes: readonly AttributeJSON[];
  readonly cosigners: readonly CosignerJSON[];
  readonly script: string;
  readonly witnesses: readonly WitnessJSON[];
}

export interface StateDescriptorJSON {
  readonly type: StateDescriptorTypeJSON;
  readonly key: string;
  readonly field: string;
  readonly value: string;
}

export type StateDescriptorTypeJSON = keyof typeof StateDescriptorTypeModel;

export interface TransactionReceiptJSON {
  readonly blockIndex: number;
  readonly blockHash: string;
  readonly transactionIndex: number;
  readonly globalIndex: string;
}

export type AssetNameJSON = string | ReadonlyArray<{ readonly lang: string; readonly name: string }>;

export interface AssetJSON {
  readonly version: number;
  readonly id: string;
  readonly type: AssetTypeJSON;
  readonly name: AssetNameJSON;
  readonly amount: string;
  readonly available: string;
  readonly precision: number;
  readonly owner: string;
  readonly admin: string;
  readonly issuer: string;
  readonly expiration: number;
  readonly frozen: boolean;
}

export type AssetTypeJSON = keyof typeof AssetTypeModel;

export interface ABIFunctionJSON {
  readonly name: string;
  readonly parameters?: readonly ContractParameterJSON[];
  readonly returnType: ContractParameterTypeJSON;
  readonly constant?: boolean;
}

export interface ABIEventJSON {
  readonly name: string;
  readonly parameters: readonly ContractParameterJSON[];
}

export interface ABIJSON {
  readonly hash: string;
  readonly entryPoint: ABIFunctionJSON;
  readonly methods: readonly ABIFunctionJSON[];
  readonly events: readonly ABIEventJSON[];
}

export interface ContractGroupJSON {
  readonly publicKey: string;
  readonly signature: string;
}

export interface ContractPermissionsJSON {
  readonly contract: string;
  readonly methods: readonly string[];
}

export interface ContractManifestJSON {
  readonly abi: ABIJSON;
  readonly groups: ContractGroupJSON;
  readonly permissions: ContractPermissionsJSON;
  readonly trusts: readonly string[];
  readonly safeMethods: readonly string[];
  readonly features: {
    readonly storage: boolean;
    readonly payable: boolean;
  };
}

export interface ContractJSON {
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
}

export interface ConsensusDataJSON {
  readonly primary: number;
  readonly nonce: string;
}

export interface HeaderJSON extends BlockBaseJSON {}

export interface BlockJSON extends BlockBaseJSON {
  readonly tx: readonly TransactionJSON[];
  readonly consensus_data: ConsensusDataJSON;
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
  readonly version: number;
  readonly publicKey: string;
  readonly registered: boolean;
  readonly votes: string;
}
