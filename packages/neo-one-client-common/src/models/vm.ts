import { createHash } from 'crypto';
import _ from 'lodash';
import { InvalidSysCallError, InvalidVMByteCodeError, InvalidVMStateError } from '../errors';

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
  PUSHNULL = 0x50,
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
  SYSCALL = 0x68,
  TOALTSTACK = 0x6b,
  FROMALTSTACK = 0x6c,
  DUPFROMALTSTACK = 0x6d,
  DUPFROMALTSTACKBOTTOM = 0x6e,
  ISNULL = 0x70,
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
  THROW = 0xf0,
  THROWIFNOT = 0xf1,
}

export type OpCode = keyof typeof Op;

export type ByteCode = Op;

// tslint:disable-next-line variable-name no-any
export const Byte: { [K in ByteCode]: OpCode } = Op as any;
// tslint:disable-next-line variable-name
export const ByteBuffer: { [K in ByteCode]: Buffer } = _.fromPairs(
  Object.values(Op).map((byteCode) => [byteCode, Buffer.from([byteCode as number])]),
  // tslint:disable-next-line no-any
) as any;

export const isByteCode = (value: number): value is ByteCode =>
  // tslint:disable-next-line strict-type-predicates
  Op[value] !== undefined;

export const assertByteCode = (value: number): ByteCode => {
  if (isByteCode(value)) {
    return value;
  }

  throw new InvalidVMByteCodeError(value);
};

export enum SysCall {
  'System.ExecutionEngine.GetScriptContainer' = 'System.ExecutionEngine.GetScriptContainer',
  'System.ExecutionEngine.GetExecutingScriptHash' = 'System.ExecutionEngine.GetExecutingScriptHash',
  'System.ExecutionEngine.GetCallingScriptHash' = 'System.ExecutionEngine.GetCallingScriptHash',
  'System.ExecutionEngine.GetEntryScriptHash' = 'System.ExecutionEngine.GetEntryScriptHash',
  'System.Runtime.Platform' = 'System.Runtime.Platform',
  'System.Runtime.GetTrigger' = 'System.Runtime.GetTrigger',
  'System.Runtime.CheckWitness' = 'System.Runtime.CheckWitness',
  'System.Runtime.Notify' = 'System.Runtime.Notify',
  'System.Runtime.Log' = 'System.Runtime.Log',
  'System.Runtime.GetTime' = 'System.Runtime.GetTime',
  'System.Runtime.Serialize' = 'System.Runtime.Serialize',
  'System.Runtime.Deserialize' = 'System.Runtime.Deserialize',
  'System.Runtime.GetInvocationCounter' = 'System.Runtime.GetInvocationCounter',
  'System.Runtime.GetNotifications' = 'System.Runtime.GetNotifications',
  'System.Crypto.Verify' = 'System.Crypto.Verify',
  'System.Blockchain.GetHeight' = 'System.Blockchain.GetHeight',
  'System.Blockchain.GetBlock' = 'System.Blockchain.GetBlock',
  'System.Blockchain.GetTransaction' = 'System.Blockchain.GetTransaction',
  'System.Blockchain.GetTransactionHeight' = 'System.Blockchain.GetTransactionHeight',
  'System.Blockchain.GetTransactionFromBlock' = 'System.Blockchain.GetTransactionFromBlock',
  'System.Blockchain.GetContract' = 'System.Blockchain.GetContract',
  'System.Contract.Call' = 'System.Contract.Call',
  'System.Contract.Destroy' = 'System.Contract.Destroy',
  'System.Storage.GetContext' = 'System.Storage.GetContext',
  'System.Storage.GetReadOnlyContext' = 'System.Storage.GetReadOnlyContext',
  'System.Storage.Get' = 'System.Storage.Get',
  'System.Storage.Put' = 'System.Storage.Put',
  'System.Storage.PutEx' = 'System.Storage.PutEx',
  'System.Storage.Delete' = 'System.Storage.Delete',
  'System.StorageContext.AsReadOnly' = 'System.StorageContext.AsReadOnly',
  'Neo.Native.Deploy' = 'Neo.Native.Deploy',
  'Neo.Crypto.CheckSig' = 'Neo.Crypto.CheckSig',
  'Neo.Crypto.CheckMultiSig' = 'Neo.Crypto.CheckMultiSig',
  'Neo.Transaction.GetScript' = 'Neo.Transaction.GetScript',
  'Neo.Account.IsStandard' = 'Neo.Account.IsStandard',
  'Neo.Contract.Create' = 'Neo.Contract.Create',
  'Neo.Contract.Update' = 'Neo.Contract.Update',
  'Neo.Storage.Find' = 'Neo.Storage.Find',
  'Neo.Enumerator.Create' = 'Neo.Enumerator.Create',
  'Neo.Enumerator.Next' = 'Neo.Enumerator.Next',
  'Neo.Enumerator.Value' = 'Neo.Enumerator.Value',
  'Neo.Enumerator.Concat' = 'Neo.Enumerator.Concat',
  'Neo.Iterator.Create' = 'Neo.Iterator.Create',
  'Neo.Iterator.Key' = 'Neo.Iterator.Key',
  'Neo.Iterator.Concat' = 'Neo.Iterator.Concat',
  'Neo.Iterator.Keys' = 'Neo.Iterator.Keys',
  'Neo.Iterator.Values' = 'Neo.Iterator.Values',
  'Neo.Json.Serialize' = 'Neo.Json.Serialize',
  'Neo.Json.Deserialize' = 'Neo.Json.Deserialize',
}

export type SysCallName = keyof typeof SysCall;

const isSysCall = (value: string): value is SysCall =>
  // tslint:disable-next-line strict-type-predicates
  SysCall[value as SysCallName] !== undefined;

export const assertSysCall = (value: string): SysCall => {
  if (isSysCall(value)) {
    return value;
  }
  throw new InvalidSysCallError(value);
};

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

export type SysCallHash = number & { readonly __uint256: undefined };

export const sha256 = (value: Buffer): Buffer =>
  createHash('sha256')
    .update(value)
    .digest();

// @ts-ignore
const mutableCache: { [K in SysCall]: SysCallHash } = {};

export const toSysCallHash = (value: SysCall): SysCallHash => {
  let hash = mutableCache[value];
  if ((hash as SysCallHash | undefined) === undefined) {
    mutableCache[value] = hash = sha256(Buffer.from(value, 'ascii')).readUInt32LE(0) as SysCallHash;
  }

  return hash;
};
