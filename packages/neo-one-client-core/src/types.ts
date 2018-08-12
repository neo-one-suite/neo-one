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

export interface ABIReturnBase {
  readonly optional?: boolean;
}

export interface SignatureABIReturn extends ABIReturnBase {
  readonly type: 'Signature';
}
export interface BooleanABIReturn extends ABIReturnBase {
  readonly type: 'Boolean';
}
export interface Hash160ABIReturn extends ABIReturnBase {
  readonly type: 'Hash160';
}
export interface Hash256ABIReturn extends ABIReturnBase {
  readonly type: 'Hash256';
}
export interface ByteArrayABIReturn extends ABIReturnBase {
  readonly type: 'ByteArray';
}
export interface PublicKeyABIReturn extends ABIReturnBase {
  readonly type: 'PublicKey';
}
export interface StringABIReturn extends ABIReturnBase {
  readonly type: 'String';
}
export interface InteropInterfaceABIReturn extends ABIReturnBase {
  readonly type: 'InteropInterface';
}
export interface VoidABIReturn extends ABIReturnBase {
  readonly type: 'Void';
}
export interface IntegerABIReturn extends ABIReturnBase {
  readonly type: 'Integer';
  readonly decimals: number;
}
export interface ArrayABIReturn extends ABIReturnBase {
  readonly type: 'Array';
  readonly value: ABIReturn;
}

export interface ABIParameterBase {
  readonly name: string;
}

export interface SignatureABIParameter extends ABIParameterBase, SignatureABIReturn {}
export interface BooleanABIParameter extends ABIParameterBase, BooleanABIReturn {}
export interface Hash160ABIParameter extends ABIParameterBase, Hash160ABIReturn {}
export interface Hash256ABIParameter extends ABIParameterBase, Hash256ABIReturn {}
export interface ByteArrayABIParameter extends ABIParameterBase, ByteArrayABIReturn {}
export interface PublicKeyABIParameter extends ABIParameterBase, PublicKeyABIReturn {}
export interface StringABIParameter extends ABIParameterBase, StringABIReturn {}
export interface InteropInterfaceABIParameter extends ABIParameterBase, InteropInterfaceABIReturn {}
export interface VoidABIParameter extends ABIParameterBase, VoidABIReturn {}
export interface IntegerABIParameter extends ABIParameterBase, IntegerABIReturn {}
export interface ArrayABIParameter extends ABIParameterBase, ArrayABIReturn {}

export type ABIReturn =
  | SignatureABIReturn
  | BooleanABIReturn
  | Hash160ABIReturn
  | Hash256ABIReturn
  | ByteArrayABIReturn
  | PublicKeyABIReturn
  | StringABIReturn
  | ArrayABIReturn
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
  | ArrayABIParameter
  | InteropInterfaceABIParameter
  | VoidABIParameter
  | IntegerABIParameter;

export type ArrayABI = ArrayABIParameter | ArrayABIReturn;
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

export interface ParamArray extends ReadonlyArray<Param> {}
export type Param =
  | undefined
  | BigNumber
  | BufferString
  | Hash160String
  | Hash256String
  | AddressString
  | PublicKeyString
  | boolean
  | ParamArray;
