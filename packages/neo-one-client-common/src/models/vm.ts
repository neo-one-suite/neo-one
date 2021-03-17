import { createHash } from 'crypto';
import _ from 'lodash';
import { InvalidFormatError } from '../common';
import { InvalidSysCallError, InvalidVMByteCodeError, InvalidVMStateError } from '../errors';

export enum Op {
  PUSHINT8 = 0x00,
  PUSHINT16 = 0x01,
  PUSHINT32 = 0x02,
  PUSHINT64 = 0x03,
  PUSHINT128 = 0x04,
  PUSHINT256 = 0x05,
  PUSHA = 0x0a,
  PUSHNULL = 0x0b,
  PUSHDATA1 = 0x0c,
  PUSHDATA2 = 0x0d,
  PUSHDATA4 = 0x0e,
  PUSHM1 = 0x0f,
  PUSH0 = 0x10,
  PUSH1 = 0x11,
  PUSH2 = 0x12,
  PUSH3 = 0x13,
  PUSH4 = 0x14,
  PUSH5 = 0x15,
  PUSH6 = 0x16,
  PUSH7 = 0x17,
  PUSH8 = 0x18,
  PUSH9 = 0x19,
  PUSH10 = 0x1a,
  PUSH11 = 0x1b,
  PUSH12 = 0x1c,
  PUSH13 = 0x1d,
  PUSH14 = 0x1e,
  PUSH15 = 0x1f,
  PUSH16 = 0x20,
  NOP = 0x21,
  JMP = 0x22,
  JMP_L = 0x23,
  JMPIF = 0x24,
  JMPIF_L = 0x25,
  JMPIFNOT = 0x26,
  JMPIFNOT_L = 0x27,
  JMPEQ = 0x28,
  JMPEQ_L = 0x29,
  JMPNE = 0x2a,
  JMPNE_L = 0x2b,
  JMPGT = 0x2c,
  JMPGT_L = 0x2d,
  JMPGE = 0x2e,
  JMPGE_L = 0x2f,
  JMPLT = 0x30,
  JMPLT_L = 0x31,
  JMPLE = 0x32,
  JMPLE_L = 0x33,
  CALL = 0x34,
  CALL_L = 0x35,
  CALLA = 0x36,
  CALLT = 0x37,
  ABORT = 0x38,
  ASSERT = 0x39,
  THROW = 0x3a,
  TRY = 0x3b,
  TRY_L = 0x3c,
  ENDTRY = 0x3d,
  ENDTRY_L = 0x3e,
  ENDFINALLY = 0x3f,
  RET = 0x40,
  SYSCALL = 0x41,
  DEPTH = 0x43,
  DROP = 0x45,
  NIP = 0x46,
  XDROP = 0x48,
  CLEAR = 0x49,
  DUP = 0x4a,
  OVER = 0x4b,
  PICK = 0x4d,
  TUCK = 0x4e,
  SWAP = 0x50,
  ROT = 0x51,
  ROLL = 0x52,
  REVERSE3 = 0x53,
  REVERSE4 = 0x54,
  REVERSEN = 0x55,
  INITSSLOT = 0x56,
  INITSLOT = 0x57,
  LDSFLD0 = 0x58,
  LDSFLD1 = 0x59,
  LDSFLD2 = 0x5a,
  LDSFLD3 = 0x5b,
  LDSFLD4 = 0x5c,
  LDSFLD5 = 0x5d,
  LDSFLD6 = 0x5e,
  LDSFLD = 0x5f,
  STSFLD0 = 0x60,
  STSFLD1 = 0x61,
  STSFLD2 = 0x62,
  STSFLD3 = 0x63,
  STSFLD4 = 0x64,
  STSFLD5 = 0x65,
  STSFLD6 = 0x66,
  STSFLD = 0x67,
  LDLOC0 = 0x68,
  LDLOC1 = 0x69,
  LDLOC2 = 0x6a,
  LDLOC3 = 0x6b,
  LDLOC4 = 0x6c,
  LDLOC5 = 0x6d,
  LDLOC6 = 0x6e,
  LDLOC = 0x6f,
  STLOC0 = 0x70,
  STLOC1 = 0x71,
  STLOC2 = 0x72,
  STLOC3 = 0x73,
  STLOC4 = 0x74,
  STLOC5 = 0x75,
  STLOC6 = 0x76,
  STLOC = 0x77,
  LDARG0 = 0x78,
  LDARG1 = 0x79,
  LDARG2 = 0x7a,
  LDARG3 = 0x7b,
  LDARG4 = 0x7c,
  LDARG5 = 0x7d,
  LDARG6 = 0x7e,
  LDARG = 0x7f,
  STARG0 = 0x80,
  STARG1 = 0x81,
  STARG2 = 0x82,
  STARG3 = 0x83,
  STARG4 = 0x84,
  STARG5 = 0x85,
  STARG6 = 0x86,
  STARG = 0x87,
  NEWBUFFER = 0x88,
  MEMCPY = 0x89,
  CAT = 0x8b,
  SUBSTR = 0x8c,
  LEFT = 0x8d,
  RIGHT = 0x8e,
  INVERT = 0x90,
  AND = 0x91,
  OR = 0x92,
  XOR = 0x93,
  EQUAL = 0x97,
  NOTEQUAL = 0x98,
  SIGN = 0x99,
  ABS = 0x9a,
  NEGATE = 0x9b,
  INC = 0x9c,
  DEC = 0x9d,
  ADD = 0x9e,
  SUB = 0x9f,
  MUL = 0xa0,
  DIV = 0xa1,
  MOD = 0xa2,
  SHL = 0xa8,
  SHR = 0xa9,
  NOT = 0xaa,
  BOOLAND = 0xab,
  BOOLOR = 0xac,
  NZ = 0xb1,
  NUMEQUAL = 0xb3,
  NUMNOTEQUAL = 0xb4,
  LT = 0xb5,
  LE = 0xb6,
  GT = 0xb7,
  GE = 0xb8,
  MIN = 0xb9,
  MAX = 0xba,
  WITHIN = 0xbb,
  PACK = 0xc0,
  UNPACK = 0xc1,
  NEWARRAY0 = 0xc2,
  NEWARRAY = 0xc3,
  NEWARRAY_T = 0xc4,
  NEWSTRUCT0 = 0xc5,
  NEWSTRUCT = 0xc6,
  NEWMAP = 0xc8,
  SIZE = 0xca,
  HASKEY = 0xcb,
  KEYS = 0xcc,
  VALUES = 0xcd,
  PICKITEM = 0xce,
  APPEND = 0xcf,
  SETITEM = 0xd0,
  REVERSEITEMS = 0xd1,
  REMOVE = 0xd2,
  CLEARITEMS = 0xd3,
  POPITEM = 0xd4,
  ISNULL = 0xd8,
  ISTYPE = 0xd9,
  CONVERT = 0xdb,
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
  'System.Binary.Serialize' = 'System.Binary.Serialize',
  'System.Binary.Deserialize' = 'System.Binary.Deserialize',
  'System.Binary.Base64Encode' = 'System.Binary.Base64Encode',
  'System.Binary.Base64Decode' = 'System.Binary.Base64Decode',
  'System.Contract.Call' = 'System.Contract.Call',
  'System.Contract.CallEx' = 'System.Contract.CallEx',
  'System.Contract.CallNative' = 'System.Contract.CallNative',
  'System.Contract.IsStandard' = 'System.Contract.IsStandard',
  'System.Contract.GetCallFlags' = 'System.Contract.GetCallFlags',
  'System.Contract.NativeOnPersist' = 'System.Contract.NativeOnPersist',
  'System.Contract.NativePostPersist' = 'System.Contract.NativePostPersist',
  'System.Contract.CreateStandardAccount' = 'System.Contract.CreateStandardAccount',
  'Neo.Crypto.RIPEMD160' = 'Neo.Crypto.RIPEMD160',
  'Neo.Crypto.SHA256' = 'Neo.Crypto.SHA256',
  'Neo.Crypto.VerifyWithECDsaSecp256r1' = 'Neo.Crypto.VerifyWithECDsaSecp256r1',
  'Neo.Crypto.VerifyWithECDsaSecp256k1' = 'Neo.Crypto.VerifyWithECDsaSecp256k1',
  'Neo.Crypto.CheckMultisigWithECDsaSecp256r1' = 'Neo.Crypto.CheckMultisigWithECDsaSecp256r1',
  'Neo.Crypto.CheckMultisigWithECDsaSecp256k1' = 'Neo.Crypto.CheckMultisigWithECDsaSecp256k1',
  'System.Iterator.Create' = 'System.Iterator.Create',
  'System.Iterator.Next' = 'System.Iterator.Next',
  'System.Iterator.Value' = 'System.Iterator.Value',
  'System.Json.Serialize' = 'System.Json.Serialize',
  'System.Json.Deserialize' = 'System.Json.Deserialize',
  'System.Runtime.Platform' = 'System.Runtime.Platform',
  'System.Runtime.GetTrigger' = 'System.Runtime.GetTrigger',
  'System.Runtime.GetTime' = 'System.Runtime.GetTime',
  'System.Runtime.GetScriptContainer' = 'System.Runtime.GetScriptContainer',
  'System.Runtime.GetExecutingScriptHash' = 'System.Runtime.GetExecutingScriptHash',
  'System.Runtime.GetCallingScriptHash' = 'System.Runtime.GetCallingScriptHash',
  'System.Runtime.GetEntryScriptHash' = 'System.Runtime.GetEntryScriptHash',
  'System.Runtime.CheckWitness' = 'System.Runtime.CheckWitness',
  'System.Runtime.GetInvocationCounter' = 'System.Runtime.GetInvocationCounter',
  'System.Runtime.Log' = 'System.Runtime.Log',
  'System.Runtime.Notify' = 'System.Runtime.Notify',
  'System.Runtime.GetNotifications' = 'System.Runtime.GetNotifications',
  'System.Runtime.GasLeft' = 'System.Runtime.GasLeft',
  'System.Storage.GetContext' = 'System.Storage.GetContext',
  'System.Storage.GetReadOnlyContext' = 'System.Storage.GetReadOnlyContext',
  'System.Storage.AsReadOnly' = 'System.Storage.AsReadOnly',
  'System.Storage.Get' = 'System.Storage.Get',
  'System.Storage.Find' = 'System.Storage.Find',
  'System.Storage.Put' = 'System.Storage.Put',
  'System.Storage.PutEx' = 'System.Storage.PutEx',
  'System.Storage.Delete' = 'System.Storage.Delete',
  'System.Binary.Base58Encode' = 'System.Binary.Base58Encode',
  'System.Binary.Base58Decode' = 'System.Binary.Base58Decode',
  'System.Binary.Itoa' = 'System.Binary.Itoa',
  'System.Binary.Atoi' = 'System.Binary.Atoi',
}

export enum SysCallHashNum {
  'System.Binary.Serialize' = 0x3f1c0124,
  'System.Binary.Deserialize' = 0x527cd0df,
  'System.Binary.Base64Encode' = 0xacbf5376,
  'System.Binary.Base64Decode' = 0xdba384c3,
  'System.Contract.Call' = 0x627d5b52,
  'System.Contract.CallEx' = 0xeef40cdb,
  'System.Contract.CallNative' = 0x1af77b67,
  'System.Contract.IsStandard' = 0xd76b9d85,
  'System.Contract.GetCallFlags' = 0x95da3a81,
  'System.Contract.NativeOnPersist' = 0x2edbbc93,
  'System.Contract.NativePostPersist' = 0x44a15d16,
  'System.Contract.CreateStandardAccount' = 0xcf998702,
  'Neo.Crypto.RIPEMD160' = 0x26d1d6d2,
  'Neo.Crypto.SHA256' = 0xd7ac7411,
  'Neo.Crypto.VerifyWithECDsaSecp256r1' = 0x95440d78,
  'Neo.Crypto.VerifyWithECDsaSecp256k1' = 0x7e3c53b7,
  'Neo.Crypto.CheckMultisigWithECDsaSecp256r1' = 0x138defaf,
  'Neo.Crypto.CheckMultisigWithECDsaSecp256k1' = 0x57c6efb2,
  'System.Iterator.Create' = 0xed64f727,
  'System.Iterator.Next' = 0x9c08ed9c,
  'System.Iterator.Value' = 0xf354bf1d,
  'System.Json.Serialize' = 0x248d264b,
  'System.Json.Deserialize' = 0xa79c470e,
  'System.Runtime.Platform' = 0xb279fcf6,
  'System.Runtime.GetTrigger' = 0xe97d38a0,
  'System.Runtime.GetTime' = 0xb7c38803,
  'System.Runtime.GetScriptContainer' = 0x2d510830,
  'System.Runtime.GetExecutingScriptHash' = 0xdbfea874,
  'System.Runtime.GetCallingScriptHash' = 0x39536e3c,
  'System.Runtime.GetEntryScriptHash' = 0xf9b4e238,
  'System.Runtime.CheckWitness' = 0xf827ec8c,
  'System.Runtime.GetInvocationCounter' = 0x84271143,
  'System.Runtime.Log' = 0xcfe74796,
  'System.Runtime.Notify' = 0x95016f61,
  'System.Runtime.GetNotifications' = 0x274335f1,
  'System.Runtime.GasLeft' = 0x1488d8ce,
  'System.Storage.GetContext' = 0x9bf667ce,
  'System.Storage.GetReadOnlyContext' = 0xf6b46be2,
  'System.Storage.AsReadOnly' = 0x764cbfe9,
  'System.Storage.Get' = 0x925de831,
  'System.Storage.Find' = 0xdf30b89a,
  'System.Storage.Put' = 0xe63f1884,
  'System.Storage.PutEx' = 0x73e19b3a,
  'System.Storage.Delete' = 0x2f58c5ed,
  'System.Binary.Base58Encode' = 0x3f57b067,
  'System.Binary.Base58Decode' = 0x6df79237,
  'System.Binary.Itoa' = 0x7be3ba7d,
  'System.Binary.Atoi' = 0x1c3840eb,
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

export type SysCallHashName = keyof typeof SysCallHashNum;

const isSysCallHash = (value: string): value is SysCallHashName =>
  // tslint:disable-next-line: strict-type-predicates
  SysCallHashNum[value as SysCallHashName] !== undefined;

export const assertSysCallHash = (value: string): SysCallHashName => {
  if (isSysCallHash(value)) {
    return value;
  }

  throw new InvalidFormatError();
};

/**
 * if we do this with less lines TS will complain about the return type;
 * we could still look into another form of storing these syscalls, should test
 * how much hashing actually affects performance before committing to changes
 */
const mutableHashCache: Record<string, Buffer | undefined> = {};
export const getSysCallHash = (sysCall: SysCallName) => {
  const maybeHash = mutableHashCache[sysCall];
  if (maybeHash === undefined) {
    const hash = sha256(Buffer.from(sysCall, 'ascii')).slice(0, 4);
    mutableHashCache[sysCall] = hash;

    return hash;
  }

  return maybeHash;
};

export enum VMState {
  NONE = 0x00,
  HALT = 0x01,
  FAULT = 0x02,
  BREAK = 0x04,
}

export type VMStateJSON = keyof typeof VMState;

const isVMState = (state: number): state is VMState =>
  // tslint:disable-next-line strict-type-predicates
  VMState[state] !== undefined;

export const assertVMState = (state: number): VMState => {
  if (isVMState(state)) {
    return state;
  }
  throw new InvalidVMStateError(state);
};

// tslint:disable-next-line: strict-type-predicates no-any
export const isVMStateJSON = (state: string): state is VMStateJSON => VMState[state as any] !== undefined;

export const assertVMStateJSON = (state: string): VMStateJSON => {
  if (isVMStateJSON(state)) {
    return state;
  }

  throw new InvalidFormatError();
};

export const toVMStateJSON = (state: VMState) => assertVMStateJSON(VMState[state]);

export type SysCallHash = number & { readonly __uint256: undefined };

export const sha256 = (value: Buffer): Buffer => createHash('sha256').update(value).digest();

// @ts-ignore
const mutableCache: { [K in SysCall]: SysCallHash } = {};

export const toSysCallHash = (value: SysCall): SysCallHash => {
  let hash = mutableCache[value];
  if ((hash as SysCallHash | undefined) === undefined) {
    mutableCache[value] = hash = sha256(Buffer.from(value, 'ascii')).readUInt32LE(0) as SysCallHash;
  }

  return hash;
};

export const toSysCallName = (hash: SysCallHashNum): SysCallHashName => assertSysCallHash(SysCallHashNum[hash]);
