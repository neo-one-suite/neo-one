import { makeErrorWithCode } from '@neo-one/utils';
import _ from 'lodash';
import { UInt160 } from './common';
import { ScriptContainer } from './ScriptContainer';
import { Witness } from './Witness';

export interface VerifyScriptOptions {
  readonly scriptContainer: ScriptContainer;
  readonly hash: UInt160;
  readonly witness: Witness;
}

export type VerifyScript = (options: VerifyScriptOptions) => Promise<void>;

export enum Op {
  PUSH0 = 0x0,
  PUSHBYTES1 = 0x1,
  PUSHBYTES2 = 0x2,
  PUSHBYTES3 = 0x3,
  PUSHBYTES4 = 0x4,
  PUSHBYTES5 = 0x5,
  PUSHBYTES6 = 0x6,
  PUSHBYTES7 = 0x7,
  PUSHBYTES8 = 0x8,
  PUSHBYTES9 = 0x9,
  PUSHBYTES10 = 0xa,
  PUSHBYTES11 = 0xb,
  PUSHBYTES12 = 0xc,
  PUSHBYTES13 = 0xd,
  PUSHBYTES14 = 0xe,
  PUSHBYTES15 = 0xf,
  PUSHBYTES16 = 0x10,
  PUSHBYTES17 = 0x11,
  PUSHBYTES18 = 0x12,
  PUSHBYTES19 = 0x13,
  PUSHBYTES20 = 0x14,
  PUSHBYTES21 = 0x15,
  PUSHBYTES22 = 0x16,
  PUSHBYTES23 = 0x17,
  PUSHBYTES24 = 0x18,
  PUSHBYTES25 = 0x19,
  PUSHBYTES26 = 0x1a,
  PUSHBYTES27 = 0x1b,
  PUSHBYTES28 = 0x1c,
  PUSHBYTES29 = 0x1d,
  PUSHBYTES30 = 0x1e,
  PUSHBYTES31 = 0x1f,
  PUSHBYTES32 = 0x20,
  PUSHBYTES33 = 0x21,
  PUSHBYTES34 = 0x22,
  PUSHBYTES35 = 0x23,
  PUSHBYTES36 = 0x24,
  PUSHBYTES37 = 0x25,
  PUSHBYTES38 = 0x26,
  PUSHBYTES39 = 0x27,
  PUSHBYTES40 = 0x28,
  PUSHBYTES41 = 0x29,
  PUSHBYTES42 = 0x2a,
  PUSHBYTES43 = 0x2b,
  PUSHBYTES44 = 0x2c,
  PUSHBYTES45 = 0x2d,
  PUSHBYTES46 = 0x2e,
  PUSHBYTES47 = 0x2f,
  PUSHBYTES48 = 0x30,
  PUSHBYTES49 = 0x31,
  PUSHBYTES50 = 0x32,
  PUSHBYTES51 = 0x33,
  PUSHBYTES52 = 0x34,
  PUSHBYTES53 = 0x35,
  PUSHBYTES54 = 0x36,
  PUSHBYTES55 = 0x37,
  PUSHBYTES56 = 0x38,
  PUSHBYTES57 = 0x39,
  PUSHBYTES58 = 0x3a,
  PUSHBYTES59 = 0x3b,
  PUSHBYTES60 = 0x3c,
  PUSHBYTES61 = 0x3d,
  PUSHBYTES62 = 0x3e,
  PUSHBYTES63 = 0x3f,
  PUSHBYTES64 = 0x40,
  PUSHBYTES65 = 0x41,
  PUSHBYTES66 = 0x42,
  PUSHBYTES67 = 0x43,
  PUSHBYTES68 = 0x44,
  PUSHBYTES69 = 0x45,
  PUSHBYTES70 = 0x46,
  PUSHBYTES71 = 0x47,
  PUSHBYTES72 = 0x48,
  PUSHBYTES73 = 0x49,
  PUSHBYTES74 = 0x4a,
  PUSHBYTES75 = 0x4b,
  PUSHDATA1 = 0x4c,
  PUSHDATA2 = 0x4d,
  PUSHDATA4 = 0x4e,
  PUSHM1 = 0x4f,
  PUSH1 = 0x51,
  PUSH2 = 0x52,
  PUSH3 = 0x53,
  PUSH4 = 0x54,
  PUSH5 = 0x55,
  PUSH6 = 0x56,
  PUSH7 = 0x57,
  PUSH8 = 0x58,
  PUSH9 = 0x59,
  PUSH10 = 0x5a,
  PUSH11 = 0x5b,
  PUSH12 = 0x5c,
  PUSH13 = 0x5d,
  PUSH14 = 0x5e,
  PUSH15 = 0x5f,
  PUSH16 = 0x60,
  NOP = 0x61,
  JMP = 0x62,
  JMPIF = 0x63,
  JMPIFNOT = 0x64,
  CALL = 0x65,
  RET = 0x66,
  APPCALL = 0x67,
  SYSCALL = 0x68,
  TAILCALL = 0x69,
  DUPFROMALTSTACK = 0x6a,
  TOALTSTACK = 0x6b,
  FROMALTSTACK = 0x6c,
  XDROP = 0x6d,
  XSWAP = 0x72,
  XTUCK = 0x73,
  DEPTH = 0x74,
  DROP = 0x75,
  DUP = 0x76,
  NIP = 0x77,
  OVER = 0x78,
  PICK = 0x79,
  ROLL = 0x7a,
  ROT = 0x7b,
  SWAP = 0x7c,
  TUCK = 0x7d,
  CAT = 0x7e,
  SUBSTR = 0x7f,
  LEFT = 0x80,
  RIGHT = 0x81,
  SIZE = 0x82,
  INVERT = 0x83,
  AND = 0x84,
  OR = 0x85,
  XOR = 0x86,
  EQUAL = 0x87,
  OP_EQUALVERIFY = 0x88,
  OP_RESERVED1 = 0x89,
  OP_RESERVED2 = 0x8a,
  INC = 0x8b,
  DEC = 0x8c,
  SIGN = 0x8d,
  NEGATE = 0x8f,
  ABS = 0x90,
  NOT = 0x91,
  NZ = 0x92,
  ADD = 0x93,
  SUB = 0x94,
  MUL = 0x95,
  DIV = 0x96,
  MOD = 0x97,
  SHL = 0x98,
  SHR = 0x99,
  BOOLAND = 0x9a,
  BOOLOR = 0x9b,
  NUMEQUAL = 0x9c,
  NUMNOTEQUAL = 0x9e,
  LT = 0x9f,
  GT = 0xa0,
  LTE = 0xa1,
  GTE = 0xa2,
  MIN = 0xa3,
  MAX = 0xa4,
  WITHIN = 0xa5,
  SHA1 = 0xa7,
  SHA256 = 0xa8,
  HASH160 = 0xa9,
  HASH256 = 0xaa,
  CHECKSIG = 0xac,
  VERIFY = 0xad,
  CHECKMULTISIG = 0xae,
  ARRAYSIZE = 0xc0,
  PACK = 0xc1,
  UNPACK = 0xc2,
  PICKITEM = 0xc3,
  SETITEM = 0xc4,
  NEWARRAY = 0xc5,
  NEWSTRUCT = 0xc6,
  NEWMAP = 0xc7,
  APPEND = 0xc8,
  REVERSE = 0xc9,
  REMOVE = 0xca,
  HASKEY = 0xcb,
  KEYS = 0xcc,
  VALUES = 0xcd,
  CALL_I = 0xe0,
  CALL_E = 0xe1,
  CALL_ED = 0xe2,
  CALL_ET = 0xe3,
  CALL_EDT = 0xe4,
  THROW = 0xf0,
  THROWIFNOT = 0xf1,
}

export type OpCode = keyof typeof Op;

export type ByteCode = Op;

// tslint:disable-next-line variable-name no-any
export const Byte: { [K in ByteCode]: OpCode } = Op as any;
// tslint:disable-next-line variable-name
export const ByteBuffer: { [K in ByteCode]: Buffer } = _.fromPairs(
  Object.values(Op).map((byteCode) => [byteCode, Buffer.from([byteCode])]),
  // tslint:disable-next-line no-any
) as any;

export const isByteCode = (value: number): value is ByteCode =>
  // tslint:disable-next-line strict-type-predicates
  Op[value] !== undefined;

export const assertByteCode = (value: number): ByteCode => {
  if (isByteCode(value)) {
    return value;
  }

  throw new Error('Invalid bytecode');
};

export enum SysCall {
  'Neo.Runtime.GetTrigger' = 'Neo.Runtime.GetTrigger',
  'Neo.Runtime.CheckWitness' = 'Neo.Runtime.CheckWitness',
  'Neo.Runtime.Notify' = 'Neo.Runtime.Notify',
  'Neo.Runtime.Log' = 'Neo.Runtime.Log',
  'Neo.Runtime.GetTime' = 'Neo.Runtime.GetTime',
  'Neo.Runtime.Serialize' = 'Neo.Runtime.Serialize',
  'Neo.Runtime.Deserialize' = 'Neo.Runtime.Deserialize',
  'Neo.Blockchain.GetHeight' = 'Neo.Blockchain.GetHeight',
  'Neo.Blockchain.GetHeader' = 'Neo.Blockchain.GetHeader',
  'Neo.Blockchain.GetBlock' = 'Neo.Blockchain.GetBlock',
  'Neo.Blockchain.GetTransaction' = 'Neo.Blockchain.GetTransaction',
  'Neo.Blockchain.GetTransactionHeight' = 'Neo.Blockchain.GetTransactionHeight',
  'Neo.Blockchain.GetAccount' = 'Neo.Blockchain.GetAccount',
  'Neo.Blockchain.GetValidators' = 'Neo.Blockchain.GetValidators',
  'Neo.Blockchain.GetAsset' = 'Neo.Blockchain.GetAsset',
  'Neo.Blockchain.GetContract' = 'Neo.Blockchain.GetContract',
  'Neo.Header.GetHash' = 'Neo.Header.GetHash',
  'Neo.Header.GetIndex' = 'Neo.Header.GetIndex',
  'Neo.Header.GetVersion' = 'Neo.Header.GetVersion',
  'Neo.Header.GetPrevHash' = 'Neo.Header.GetPrevHash',
  'Neo.Header.GetMerkleRoot' = 'Neo.Header.GetMerkleRoot',
  'Neo.Header.GetTimestamp' = 'Neo.Header.GetTimestamp',
  'Neo.Header.GetConsensusData' = 'Neo.Header.GetConsensusData',
  'Neo.Header.GetNextConsensus' = 'Neo.Header.GetNextConsensus',
  'Neo.Block.GetTransactionCount' = 'Neo.Block.GetTransactionCount',
  'Neo.Block.GetTransactions' = 'Neo.Block.GetTransactions',
  'Neo.Block.GetTransaction' = 'Neo.Block.GetTransaction',
  'Neo.Transaction.GetHash' = 'Neo.Transaction.GetHash',
  'Neo.Transaction.GetType' = 'Neo.Transaction.GetType',
  'Neo.Transaction.GetAttributes' = 'Neo.Transaction.GetAttributes',
  'Neo.Transaction.GetInputs' = 'Neo.Transaction.GetInputs',
  'Neo.Transaction.GetOutputs' = 'Neo.Transaction.GetOutputs',
  'Neo.Transaction.GetReferences' = 'Neo.Transaction.GetReferences',
  'Neo.Transaction.GetUnspentCoins' = 'Neo.Transaction.GetUnspentCoins',
  'Neo.InvocationTransaction.GetScript' = 'Neo.InvocationTransaction.GetScript',
  'Neo.Attribute.GetUsage' = 'Neo.Attribute.GetUsage',
  'Neo.Attribute.GetData' = 'Neo.Attribute.GetData',
  'Neo.Input.GetHash' = 'Neo.Input.GetHash',
  'Neo.Input.GetIndex' = 'Neo.Input.GetIndex',
  'Neo.Output.GetAssetId' = 'Neo.Output.GetAssetId',
  'Neo.Output.GetValue' = 'Neo.Output.GetValue',
  'Neo.Output.GetScriptHash' = 'Neo.Output.GetScriptHash',
  'Neo.Account.GetScriptHash' = 'Neo.Account.GetScriptHash',
  'Neo.Account.GetVotes' = 'Neo.Account.GetVotes',
  'Neo.Account.GetBalance' = 'Neo.Account.GetBalance',
  'Neo.Asset.GetAssetId' = 'Neo.Asset.GetAssetId',
  'Neo.Asset.GetAssetType' = 'Neo.Asset.GetAssetType',
  'Neo.Asset.GetAmount' = 'Neo.Asset.GetAmount',
  'Neo.Asset.GetAvailable' = 'Neo.Asset.GetAvailable',
  'Neo.Asset.GetPrecision' = 'Neo.Asset.GetPrecision',
  'Neo.Asset.GetOwner' = 'Neo.Asset.GetOwner',
  'Neo.Asset.GetAdmin' = 'Neo.Asset.GetAdmin',
  'Neo.Asset.GetIssuer' = 'Neo.Asset.GetIssuer',
  'Neo.Contract.GetScript' = 'Neo.Contract.GetScript',
  'Neo.Contract.IsPayable' = 'Neo.Contract.IsPayable',
  'Neo.Storage.GetContext' = 'Neo.Storage.GetContext',
  'Neo.Storage.GetReadOnlyContext' = 'Neo.Storage.GetReadOnlyContext',
  'Neo.Storage.Get' = 'Neo.Storage.Get',
  'Neo.Storage.Find' = 'Neo.Storage.Find',
  'Neo.StorageContext.AsReadOnly' = 'Neo.StorageContext.AsReadOnly',
  'Neo.Enumerator.Create' = 'Neo.Enumerator.Create',
  'Neo.Iterator.Create' = 'Neo.Iterator.Create',
  'Neo.Enumerator.Next' = 'Neo.Enumerator.Next',
  'Neo.Iterator.Key' = 'Neo.Iterator.Key',
  'Neo.Enumerator.Value' = 'Neo.Enumerator.Value',
  'Neo.Enumerator.Concat' = 'Neo.Enumerator.Concat',
  'Neo.Iterator.Concat' = 'Neo.Iterator.Concat',
  'Neo.Iterator.Keys' = 'Neo.Iterator.Keys',
  'Neo.Iterator.Values' = 'Neo.Iterator.Values',
  'Neo.Account.SetVotes' = 'Neo.Account.SetVotes',
  'Neo.Validator.Register' = 'Neo.Validator.Register',
  'Neo.Asset.Create' = 'Neo.Asset.Create',
  'Neo.Asset.Renew' = 'Neo.Asset.Renew',
  'Neo.Contract.Create' = 'Neo.Contract.Create',
  'Neo.Contract.Migrate' = 'Neo.Contract.Migrate',
  'Neo.Contract.GetStorageContext' = 'Neo.Contract.GetStorageContext',
  'Neo.Contract.Destroy' = 'Neo.Contract.Destroy',
  'Neo.Storage.Put' = 'Neo.Storage.Put',
  'Neo.Storage.Delete' = 'Neo.Storage.Delete',
  'System.ExecutionEngine.GetScriptContainer' = 'System.ExecutionEngine.GetScriptContainer',
  'System.ExecutionEngine.GetExecutingScriptHash' = 'System.ExecutionEngine.GetExecutingScriptHash',
  'System.ExecutionEngine.GetCallingScriptHash' = 'System.ExecutionEngine.GetCallingScriptHash',
  'System.ExecutionEngine.GetEntryScriptHash' = 'System.ExecutionEngine.GetEntryScriptHash',
}

export type SysCallName = keyof typeof SysCall;

export const InvalidSysCallError = makeErrorWithCode(
  'INVALID_SYS_CALL_NAME',
  (value: string) => `Expected sys call name, found: ${value}`,
);

const isSysCall = (value: string): value is SysCall =>
  // tslint:disable-next-line strict-type-predicates no-any
  SysCall[value as any] !== undefined;

export const assertSysCall = (value: string): SysCall => {
  if (isSysCall(value)) {
    return value;
  }
  throw new InvalidSysCallError(value);
};

export const InvalidVMStateError = makeErrorWithCode(
  'INVALID_VM_STATE',
  (state: number) => `Invalid VM State: ${state}`,
);

export enum VMState {
  None = 0x00,
  Halt = 0x01,
  Fault = 0x02,
  Break = 0x04,
}

const isVMState = (state: number): state is VMState =>
  // tslint:disable-next-line strict-type-predicates
  VMState[state] !== undefined;

export const assertVMState = (state: number): VMState => {
  if (isVMState(state)) {
    return state;
  }
  throw new InvalidVMStateError(state);
};
