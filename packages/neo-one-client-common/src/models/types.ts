import { AssetTypeModel } from './AssetTypeModel';
import { ContractParameterTypeModel } from './ContractParameterTypeModel';
import { StateDescriptorTypeModel } from './StateDescriptorTypeModel';
import { StorageFlagsModel } from './StorageFlagsModel';
import { AttributeUsageModel } from './transaction';
import { VMState } from './vm';

export interface AccountJSON {
  readonly version: number;
  readonly script_hash: string;
  readonly frozen: boolean;
  readonly votes: ReadonlyArray<string>;
  readonly balances: ReadonlyArray<{ readonly asset: string; readonly value: string }>;
  readonly unspent: ReadonlyArray<InputJSON>;
  readonly unclaimed: ReadonlyArray<InputJSON>;
}

export interface ArrayContractParameterJSON {
  readonly type: 'Array';
  readonly value: ReadonlyArray<ContractParameterJSON>;
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
  readonly value: ReadonlyArray<[ContractParameterJSON, ContractParameterJSON]>;
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

export interface InvocationResultErrorJSON {
  readonly state: VMState.Fault;
  readonly gas_consumed: string;
  readonly gas_cost: string;
  readonly stack: ReadonlyArray<ContractParameterJSON>;
  readonly message: string;
}

export interface InvocationResultSuccessJSON {
  readonly state: VMState.Halt;
  readonly gas_consumed: string;
  readonly gas_cost: string;
  readonly stack: ReadonlyArray<ContractParameterJSON>;
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
  readonly args: ReadonlyArray<ContractParameterJSON>;
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
  readonly contracts: ReadonlyArray<ContractJSON>;
  readonly deletedContractHashes: ReadonlyArray<string>;
  readonly migratedContractHashes: ReadonlyArray<[string, string]>;
  readonly voteUpdates: ReadonlyArray<[string, ReadonlyArray<string>]>;
  readonly actions: ReadonlyArray<ActionJSON>;
  readonly storageChanges: ReadonlyArray<StorageChangeJSON>;
}

export interface TransactionBaseJSON {
  readonly txid: string;
  readonly size: number;
  readonly version: number;
  readonly attributes: ReadonlyArray<AttributeJSON>;
  readonly vin: ReadonlyArray<InputJSON>;
  readonly vout: ReadonlyArray<OutputJSON>;
  readonly scripts: ReadonlyArray<WitnessJSON>;
  readonly sys_fee: string;
  readonly net_fee: string;
  readonly data:
    | {
        readonly blockHash: string;
        readonly blockIndex: number;
        readonly transactionIndex: number;
        readonly globalIndex: string;
      }
    | undefined;
}

export interface ClaimTransactionJSON extends TransactionBaseJSON {
  readonly type: 'ClaimTransaction';
  readonly claims: ReadonlyArray<InputJSON>;
}

export interface ContractTransactionJSON extends TransactionBaseJSON {
  readonly type: 'ContractTransaction';
}

export interface EnrollmentTransactionJSON extends TransactionBaseJSON {
  readonly type: 'EnrollmentTransaction';
  readonly pubkey: string;
}

export interface IssueTransactionJSON extends TransactionBaseJSON {
  readonly type: 'IssueTransaction';
}

export interface MinerTransactionJSON extends TransactionBaseJSON {
  readonly type: 'MinerTransaction';
  readonly nonce: number;
}

export interface PublishTransactionJSON extends TransactionBaseJSON {
  readonly type: 'PublishTransaction';
  readonly contract: ContractJSON;
}

export interface RegisterTransactionJSON extends TransactionBaseJSON {
  readonly type: 'RegisterTransaction';
  readonly asset: {
    readonly type: AssetTypeJSON;
    readonly name: AssetNameJSON;
    readonly amount: string;
    readonly precision: number;
    readonly owner: string;
    readonly admin: string;
  };
}

export interface StateDescriptorJSON {
  readonly type: StateDescriptorTypeJSON;
  readonly key: string;
  readonly field: string;
  readonly value: string;
}

export type StateDescriptorTypeJSON = keyof typeof StateDescriptorTypeModel;

export interface StateTransactionJSON extends TransactionBaseJSON {
  readonly type: 'StateTransaction';
  readonly descriptors: ReadonlyArray<StateDescriptorJSON>;
}

export interface InvocationTransactionJSON extends TransactionBaseJSON {
  readonly type: 'InvocationTransaction';
  readonly script: string;
  readonly gas: string;
  readonly invocationData?: InvocationDataJSON | undefined;
}

export type TransactionJSON =
  | MinerTransactionJSON
  | IssueTransactionJSON
  | ClaimTransactionJSON
  | EnrollmentTransactionJSON
  | RegisterTransactionJSON
  | ContractTransactionJSON
  | PublishTransactionJSON
  | StateTransactionJSON
  | InvocationTransactionJSON;

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

export interface ContractJSON {
  readonly version: number;
  readonly hash: string;
  readonly script: string;
  readonly parameters: ReadonlyArray<ContractParameterTypeJSON>;
  readonly returntype: ContractParameterTypeJSON;
  readonly name: string;
  readonly code_version: string;
  readonly author: string;
  readonly email: string;
  readonly description: string;
  readonly properties: {
    readonly storage: boolean;
    readonly dynamic_invoke: boolean;
    readonly payable: boolean;
  };
}

export interface BlockBaseJSON {
  readonly version: number;
  readonly hash: string;
  readonly previousblockhash: string;
  readonly merkleroot: string;
  readonly time: number;
  readonly index: number;
  readonly nonce: string;
  readonly nextconsensus: string;
  readonly script: WitnessJSON;
  readonly size: number;
  readonly confirmations: number;
}

export interface HeaderJSON extends BlockBaseJSON {}

export interface BlockJSON extends BlockBaseJSON {
  readonly tx: ReadonlyArray<TransactionJSON>;
}

export interface NetworkSettingsJSON {
  readonly issueGASFee: string;
}

export interface CallReceiptJSON {
  readonly result: InvocationResultJSON;
  readonly actions: ReadonlyArray<ActionJSON>;
}

export interface VerifyScriptResultJSON {
  readonly failureMessage?: string;
  readonly hash: string;
  readonly witness: WitnessJSON;
  readonly actions: ReadonlyArray<ActionJSON>;
}

export interface VerifyTransactionResultJSON {
  readonly verifications: ReadonlyArray<VerifyScriptResultJSON>;
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
