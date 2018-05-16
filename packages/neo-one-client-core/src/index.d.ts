import BN from 'bn.js';

export type ECPoint = Buffer;
export type UInt160 = Buffer;
export type UInt256 = Buffer;

export declare interface DeserializeWireContext {}

export declare interface Block {}
export declare interface RegisterTransaction {}

export declare enum VM_STATE {
  NONE = 0x00,
  HALT = 0x01,
  FAULT = 0x02,
  BREAK = 0x04,
}

export declare interface VMState {}

export enum ContractParameterType {
  Integer = 0x02,
}

export declare interface IntegerContractParameter {
  type: ContractParameterType.Integer;
  value: BN;
}

export declare type ContractParameter = IntegerContractParameter;

export declare interface InvocationResult {
  state: VM_STATE;
  gasCost: BN;
  gasConsumed: BN;
  stack: ContractParameter[];
  message: string;
}

export declare interface VMSettings {
  storageContext: {
    v0: { index: number };
  };
}

export declare interface Settings {
  genesisBlock: Block;
  governingToken: RegisterTransaction;
  utilityToken: RegisterTransaction;
  decrementInterval: number;
  generationAmount: number[];
  fees: { [transactionType: number]: BN };
  messageMagic: number;
  addressVersion: number;
  privateKeyVersion: number;
  standbyValidators: ECPoint[];
  vm: VMSettings;
  secondsPerBlock: number;
  maxTransactionsPerBlock: number;
}

export type OpCode =
  | 'PUSH0'
  | 'PUSHBYTES1'
  | 'PUSHBYTES2'
  | 'PUSHBYTES3'
  | 'PUSHBYTES4'
  | 'PUSHBYTES5'
  | 'PUSHBYTES6'
  | 'PUSHBYTES7'
  | 'PUSHBYTES8'
  | 'PUSHBYTES9'
  | 'PUSHBYTES10'
  | 'PUSHBYTES11'
  | 'PUSHBYTES12'
  | 'PUSHBYTES13'
  | 'PUSHBYTES14'
  | 'PUSHBYTES15'
  | 'PUSHBYTES16'
  | 'PUSHBYTES17'
  | 'PUSHBYTES18'
  | 'PUSHBYTES19'
  | 'PUSHBYTES20'
  | 'PUSHBYTES21'
  | 'PUSHBYTES22'
  | 'PUSHBYTES23'
  | 'PUSHBYTES24'
  | 'PUSHBYTES25'
  | 'PUSHBYTES26'
  | 'PUSHBYTES27'
  | 'PUSHBYTES28'
  | 'PUSHBYTES29'
  | 'PUSHBYTES30'
  | 'PUSHBYTES31'
  | 'PUSHBYTES32'
  | 'PUSHBYTES33'
  | 'PUSHBYTES34'
  | 'PUSHBYTES35'
  | 'PUSHBYTES36'
  | 'PUSHBYTES37'
  | 'PUSHBYTES38'
  | 'PUSHBYTES39'
  | 'PUSHBYTES40'
  | 'PUSHBYTES41'
  | 'PUSHBYTES42'
  | 'PUSHBYTES43'
  | 'PUSHBYTES44'
  | 'PUSHBYTES45'
  | 'PUSHBYTES46'
  | 'PUSHBYTES47'
  | 'PUSHBYTES48'
  | 'PUSHBYTES49'
  | 'PUSHBYTES50'
  | 'PUSHBYTES51'
  | 'PUSHBYTES52'
  | 'PUSHBYTES53'
  | 'PUSHBYTES54'
  | 'PUSHBYTES55'
  | 'PUSHBYTES56'
  | 'PUSHBYTES57'
  | 'PUSHBYTES58'
  | 'PUSHBYTES59'
  | 'PUSHBYTES60'
  | 'PUSHBYTES61'
  | 'PUSHBYTES62'
  | 'PUSHBYTES63'
  | 'PUSHBYTES64'
  | 'PUSHBYTES65'
  | 'PUSHBYTES66'
  | 'PUSHBYTES67'
  | 'PUSHBYTES68'
  | 'PUSHBYTES69'
  | 'PUSHBYTES70'
  | 'PUSHBYTES71'
  | 'PUSHBYTES72'
  | 'PUSHBYTES73'
  | 'PUSHBYTES75'
  | 'PUSHDATA1'
  | 'PUSHDATA2'
  | 'PUSHDATA4'
  | 'PUSHM1'
  | 'PUSH1'
  | 'PUSH2'
  | 'PUSH3'
  | 'PUSH4'
  | 'PUSH5'
  | 'PUSH6'
  | 'PUSH7'
  | 'PUSH8'
  | 'PUSH9'
  | 'PUSH10'
  | 'PUSH11'
  | 'PUSH12'
  | 'PUSH13'
  | 'PUSH14'
  | 'PUSH15'
  | 'PUSH16'
  | 'NOP'
  | 'JMP'
  | 'JMPIF'
  | 'JMPIFNOT'
  | 'CALL'
  | 'RET'
  | 'APPCALL'
  | 'SYSCALL'
  | 'TAILCALL'
  | 'DUPFROMALTSTACK'
  | 'TOALTSTACK'
  | 'FROMALTSTACK'
  | 'XDROP'
  | 'XSWAP'
  | 'XTUCK'
  | 'DEPTH'
  | 'DROP'
  | 'DUP'
  | 'NIP'
  | 'OVER'
  | 'PICK'
  | 'ROLL'
  | 'ROT'
  | 'SWAP'
  | 'TUCK'
  | 'CAT'
  | 'SUBSTR'
  | 'LEFT'
  | 'RIGHT'
  | 'SIZE'
  | 'INVERT'
  | 'AND'
  | 'OR'
  | 'XOR'
  | 'EQUAL'
  | 'OP_EQUALVERIFY'
  | 'OP_RESERVED1'
  | 'OP_RESERVED2'
  | 'INC'
  | 'DEC'
  | 'SIGN'
  | 'NEGATE'
  | 'ABS'
  | 'NOT'
  | 'NZ'
  | 'ADD'
  | 'SUB'
  | 'MUL'
  | 'DIV'
  | 'MOD'
  | 'SHL'
  | 'SHR'
  | 'BOOLAND'
  | 'BOOLOR'
  | 'NUMEQUAL'
  | 'NUMNOTEQUAL'
  | 'LT'
  | 'GT'
  | 'LTE'
  | 'GTE'
  | 'MIN'
  | 'MAX'
  | 'WITHIN'
  | 'SHA1'
  | 'SHA256'
  | 'HASH160'
  | 'HASH256'
  | 'CHECKSIG'
  | 'CHECKMULTISIG'
  | 'ARRAYSIZE'
  | 'PACK'
  | 'UNPACK'
  | 'PICKITEM'
  | 'SETITEM'
  | 'NEWARRAY'
  | 'NEWSTRUCT'
  | 'NEWMAP'
  | 'APPEND'
  | 'REVERSE'
  | 'REMOVE'
  | 'HASKEY'
  | 'KEYS'
  | 'VALUES'
  | 'THROW'
  | 'THROWIFNOT';

export declare type ByteCode = number;
export declare const BYTECODE_TO_BYTECODE_BUFFER: {
  [bytecode: string]: Buffer;
};
export declare const OPCODE_TO_BYTECODE: { [opCode: string]: number };

export declare class UnknownOpError {
  constructor(byteCode: string);
}

export declare type SysCallName =
  | 'Neo.Runtime.GetTrigger'
  | 'Neo.Runtime.CheckWitness'
  | 'Neo.Runtime.Notify'
  | 'Neo.Runtime.Log'
  | 'Neo.Runtime.GetTime'
  | 'Neo.Runtime.Serialize'
  | 'Neo.Runtime.Deserialize'
  | 'Neo.Blockchain.GetHeight'
  | 'Neo.Blockchain.GetHeader'
  | 'Neo.Blockchain.GetBlock'
  | 'Neo.Blockchain.GetTransaction'
  | 'Neo.Blockchain.GetAccount'
  | 'Neo.Blockchain.GetValidators'
  | 'Neo.Blockchain.GetAsset'
  | 'Neo.Blockchain.GetContract'
  | 'Neo.Header.GetHash'
  | 'Neo.Header.GetVersion'
  | 'Neo.Header.GetPrevHash'
  | 'Neo.Header.GetIndex'
  | 'Neo.Header.GetMerkleRoot'
  | 'Neo.Header.GetTimestamp'
  | 'Neo.Header.GetConsensusData'
  | 'Neo.Header.GetNextConsensus'
  | 'Neo.Block.GetTransactionCount'
  | 'Neo.Block.GetTransactions'
  | 'Neo.Block.GetTransaction'
  | 'Neo.Transaction.GetHash'
  | 'Neo.Transaction.GetType'
  | 'Neo.Transaction.GetAttributes'
  | 'Neo.Transaction.GetInputs'
  | 'Neo.Transaction.GetOutputs'
  | 'Neo.Transaction.GetReferences'
  | 'Neo.Transaction.GetUnspentCoins'
  | 'Neo.InvocationTransaction.GetScript'
  | 'Neo.Attribute.GetUsage'
  | 'Neo.Attribute.GetData'
  | 'Neo.Input.GetHash'
  | 'Neo.Input.GetIndex'
  | 'Neo.Output.GetAssetId'
  | 'Neo.Output.GetValue'
  | 'Neo.Output.GetScriptHash'
  | 'Neo.Account.GetScriptHash'
  | 'Neo.Account.GetVotes'
  | 'Neo.Account.GetBalance'
  | 'Neo.Asset.GetAssetId'
  | 'Neo.Asset.GetAssetType'
  | 'Neo.Asset.GetAmount'
  | 'Neo.Asset.GetAvailable'
  | 'Neo.Asset.GetPrecision'
  | 'Neo.Asset.GetOwner'
  | 'Neo.Asset.GetAdmin'
  | 'Neo.Asset.GetIssuer'
  | 'Neo.Contract.GetScript'
  | 'Neo.Storage.GetContext'
  | 'Neo.Storage.Get'
  | 'Neo.Storage.Find'
  | 'Neo.Iterator.Next'
  | 'Neo.Iterator.Key'
  | 'Neo.Iterator.Value'
  | 'Neo.Account.SetVotes'
  | 'Neo.Validator.Register'
  | 'Neo.Asset.Create'
  | 'Neo.Asset.Renew'
  | 'Neo.Contract.Create'
  | 'Neo.Contract.Migrate'
  | 'Neo.Contract.GetStorageContext'
  | 'Neo.Contract.Destroy'
  | 'Neo.Storage.Put'
  | 'Neo.Storage.Delete'
  | 'System.ExecutionEngine.GetScriptContainer'
  | 'System.ExecutionEngine.GetExecutingScriptHash'
  | 'System.ExecutionEngine.GetCallingScriptHash'
  | 'System.ExecutionEngine.GetEntryScriptHash';

declare namespace utils {
  export const ZERO: BN;
  export const NEGATIVE_ONE: BN;
  export const SIXTEEN: BN;

  export function toSignedBuffer(value: BN): Buffer;
}

export declare class BinaryWriter {
  toBuffer(): Buffer;
  writeVarBytesLE(buffer: Buffer): BinaryWriter;
}

export interface ParamArray extends Array<Param> {}
export type Param =
  | BN
  | number
  | UInt160
  | UInt256
  | ECPoint
  | string
  | Buffer
  | boolean
  | ParamArray;

export declare class ScriptBuilder {
  emitPush(value: Buffer): ScriptBuilder;
  emitUInt8(value: number): ScriptBuilder;
  emitUInt16LE(value: number): ScriptBuilder;
  emitInt16LE(value: number): ScriptBuilder;
  emitUInt32LE(value: number): ScriptBuilder;
  emitPushInt(valueIn: number | BN): ScriptBuilder;
  emitPushUInt160(value: UInt160): ScriptBuilder;
  emitPushUInt256(value: UInt256): ScriptBuilder;
  emitPushECPoint(ecPoint: ECPoint): ScriptBuilder;
  emitPushString(value: string): ScriptBuilder;
  emitPushBoolean(value: boolean): ScriptBuilder;
  emitOp(op: OpCode, buffer?: Buffer | null): ScriptBuilder;
  emitPushParam(param: Param | null): ScriptBuilder;
  emitPushParams(...params: Array<Param | null>): ScriptBuilder;
  emitPushArray(params: Array<Param | null>): ScriptBuilder;
  emitAppCallInvocation(
    operation: string,
    ...params: Array<Param | null>
  ): ScriptBuilder;
  emitAppCallVerification(scriptHash: UInt160): ScriptBuilder;
  emitAppCall(
    scriptHash: UInt160,
    operation: string,
    ...params: Array<Param | null>
  ): ScriptBuilder;
  emitTailCall(
    scriptHash: UInt160,
    operation: string,
    ...params: Array<Param | null>
  ): ScriptBuilder;
  emitSysCall(
    sysCall: SysCallName,
    ...params: Array<Param | null>
  ): ScriptBuilder;
  emit(buffer?: Buffer | null): ScriptBuilder;
  build(): Buffer;
}
