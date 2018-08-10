import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';

// A NEO address string, e.g. APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR
export type AddressString = string;
// Hex Buffer, e.g. cef0c0fdcfe7838eff6ff104f9cdec2922297537
export type BufferString = string;
// NEO Hash160 string, e.g. 0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9
export type Hash160String = string;
// NEO Hash256 string, e.g. 0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c
export type Hash256String = string;
// Hex PublicKey, e.g. 02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef
export type PublicKeyString = string;
// Hex Buffer, e.g. 02028a99826ed
export type SignatureString = string;

export interface SignatureContractParameter {
  readonly type: 'Signature';
  readonly value: BufferString;
}

export interface BooleanContractParameter {
  readonly type: 'Boolean';
  readonly value: boolean;
}

export interface IntegerContractParameter {
  readonly type: 'Integer';
  readonly value: BN;
}

export interface Hash160ContractParameter {
  readonly type: 'Hash160';
  readonly value: Hash160String;
}

export interface Hash256ContractParameter {
  readonly type: 'Hash256';
  readonly value: Hash256String;
}

export interface ByteArrayContractParameter {
  readonly type: 'ByteArray';
  readonly value: BufferString;
}

export interface PublicKeyContractParameter {
  readonly type: 'PublicKey';
  readonly value: PublicKeyString;
}

export interface StringContractParameter {
  readonly type: 'String';
  readonly value: string;
}

export interface ArrayContractParameter {
  readonly type: 'Array';

  readonly value: ReadonlyArray<ContractParameter>;
}

export interface InteropInterfaceContractParameter {
  readonly type: 'InteropInterface';
}

export interface VoidContractParameter {
  readonly type: 'Void';
}

export type ContractParameter =
  | SignatureContractParameter
  | BooleanContractParameter
  | IntegerContractParameter
  | Hash160ContractParameter
  | Hash256ContractParameter
  | ByteArrayContractParameter
  | PublicKeyContractParameter
  | StringContractParameter
  | ArrayContractParameter
  | InteropInterfaceContractParameter
  | VoidContractParameter;

export interface RawInvocationResultSuccess {
  readonly state: 'HALT';
  readonly gasConsumed: BigNumber;
  readonly gasCost: BigNumber;
  readonly stack: ReadonlyArray<ContractParameter>;
}

export interface RawInvocationResultError {
  readonly state: 'FAULT';
  readonly gasConsumed: BigNumber;
  readonly gasCost: BigNumber;
  readonly stack: ReadonlyArray<ContractParameter>;
  readonly message: string;
}

export type RawInvocationResult = RawInvocationResultSuccess | RawInvocationResultError;

export interface ActionRawBase {
  readonly version: number;
  readonly blockIndex: number;
  readonly blockHash: Hash256String;
  readonly transactionIndex: number;
  readonly transactionHash: Hash256String;
  readonly index: number;
  readonly globalIndex: BigNumber;
  readonly scriptHash: Hash160String;
}

export interface NotificationRaw extends ActionRawBase {
  readonly type: 'Notification';
  readonly args: ReadonlyArray<ContractParameter>;
}

export interface LogRaw extends ActionRawBase {
  readonly type: 'Log';
  readonly message: string;
}

export type ActionRaw = NotificationRaw | LogRaw;

export interface TransactionReceipt {
  readonly blockIndex: number;
  readonly blockHash: Hash256String;
  readonly transactionIndex: number;
}

export interface RawInvokeReceipt extends TransactionReceipt {
  readonly result: RawInvocationResult;
  readonly actions: ReadonlyArray<ActionRaw>;
}

export interface RawCallReceipt {
  readonly result: RawInvocationResult;
  readonly actions: ReadonlyArray<ActionRaw>;
}

export interface SignatureABIReturn {
  readonly type: 'Signature';
}
export interface BooleanABIReturn {
  readonly type: 'Boolean';
}
export interface Hash160ABIReturn {
  readonly type: 'Hash160';
}
export interface Hash256ABIReturn {
  readonly type: 'Hash256';
}
export interface ByteArrayABIReturn {
  readonly type: 'ByteArray';
}
export interface PublicKeyABIReturn {
  readonly type: 'PublicKey';
}
export interface StringABIReturn {
  readonly type: 'String';
}
export interface InteropInterfaceABIReturn {
  readonly type: 'InteropInterface';
}
export interface VoidABIReturn {
  readonly type: 'Void';
}
export interface IntegerABIReturn {
  readonly type: 'Integer';
  readonly decimals: number;
}

export interface SignatureABIParameter {
  readonly name: string;
  readonly type: 'Signature';
}
export interface BooleanABIParameter {
  readonly name: string;
  readonly type: 'Boolean';
}
export interface Hash160ABIParameter {
  readonly name: string;
  readonly type: 'Hash160';
}
export interface Hash256ABIParameter {
  readonly name: string;
  readonly type: 'Hash256';
}
export interface ByteArrayABIParameter {
  readonly name: string;
  readonly type: 'ByteArray';
}
export interface PublicKeyABIParameter {
  readonly name: string;
  readonly type: 'PublicKey';
}
export interface StringABIParameter {
  readonly name: string;
  readonly type: 'String';
}
export interface InteropInterfaceABIParameter {
  readonly name: string;
  readonly type: 'InteropInterface';
}
export interface VoidABIParameter {
  readonly name: string;
  readonly type: 'Void';
}
export interface IntegerABIParameter {
  readonly name: string;
  readonly type: 'Integer';
  readonly decimals: number;
}

export type ABIReturn =
  | SignatureABIReturn
  | BooleanABIReturn
  | Hash160ABIReturn
  | Hash256ABIReturn
  | ByteArrayABIReturn
  | PublicKeyABIReturn
  | StringABIReturn
  | { readonly type: 'Array'; readonly value: ABIReturn }
  | InteropInterfaceABIReturn
  | VoidABIReturn
  | IntegerABIReturn;
export type ABIParameter =
  | SignatureABIParameter
  | BooleanABIParameter
  | Hash160ABIParameter
  | Hash256ABIParameter
  | ByteArrayABIParameter
  | PublicKeyABIParameter
  | StringABIParameter
  | { readonly name: string; readonly type: 'Array'; readonly value: ABIReturn }
  | InteropInterfaceABIParameter
  | VoidABIParameter
  | IntegerABIParameter;

export type ArrayABI =
  | { readonly type: 'Array'; readonly value: ABIReturn }
  | { readonly name: string; readonly type: 'Array'; readonly value: ABIReturn };
export type SignatureABI = SignatureABIParameter | SignatureABIReturn;
export type BooleanABI = BooleanABIParameter | BooleanABIReturn;
export type Hash160ABI = Hash160ABIParameter | Hash160ABIReturn;
export type Hash256ABI = Hash256ABIParameter | Hash256ABIReturn;
export type ByteArrayABI = ByteArrayABIParameter | ByteArrayABIReturn;
export type PublicKeyABI = PublicKeyABIParameter | PublicKeyABIReturn;
export type StringABI = StringABIParameter | StringABIReturn;
export type InteropInterfaceABI = InteropInterfaceABIParameter | InteropInterfaceABIReturn;
export type VoidABI = VoidABIParameter | VoidABIReturn;
export type IntegerABI = IntegerABIParameter | IntegerABIReturn;

export interface ABIFunction {
  readonly name: string;
  readonly constant?: boolean;
  readonly parameters?: ReadonlyArray<ABIParameter>;
  readonly verify?: boolean;
  readonly returnType: ABIReturn;
}

export interface ABIEvent {
  readonly name: string;
  readonly parameters: ReadonlyArray<ABIParameter>;
}

export interface ABI {
  readonly functions: ReadonlyArray<ABIFunction>;
  readonly events?: ReadonlyArray<ABIEvent>;
}

export interface ParamArray extends Array<Param | undefined> {}
export type Param =
  | BigNumber
  | BufferString
  | Hash160String
  | Hash256String
  | AddressString
  | PublicKeyString
  | boolean
  | ParamArray;
