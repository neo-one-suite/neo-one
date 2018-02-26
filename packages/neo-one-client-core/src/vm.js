/* @flow */
import { CustomError } from '@neo-one/utils';

import _ from 'lodash';

import type { ScriptContainer } from './ScriptContainer';
import type { UInt160 } from './common';
import type Witness from './Witness';

export type VerifyScriptOptions = {|
  scriptContainer: ScriptContainer,
  hash: UInt160,
  witness: Witness,
|};
export type VerifyScript = (options: VerifyScriptOptions) => Promise<void>;

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

export type ByteCode =
  | 0x0
  | 0x1
  | 0x2
  | 0x3
  | 0x4
  | 0x5
  | 0x6
  | 0x7
  | 0x8
  | 0x9
  | 0xa
  | 0xb
  | 0xc
  | 0xd
  | 0xe
  | 0xf
  | 0x10
  | 0x11
  | 0x12
  | 0x13
  | 0x14
  | 0x15
  | 0x16
  | 0x17
  | 0x18
  | 0x19
  | 0x1a
  | 0x1b
  | 0x1c
  | 0x1d
  | 0x1e
  | 0x1f
  | 0x20
  | 0x21
  | 0x22
  | 0x23
  | 0x24
  | 0x25
  | 0x26
  | 0x27
  | 0x28
  | 0x29
  | 0x2a
  | 0x2b
  | 0x2c
  | 0x2d
  | 0x2e
  | 0x2f
  | 0x30
  | 0x31
  | 0x32
  | 0x33
  | 0x34
  | 0x35
  | 0x36
  | 0x37
  | 0x38
  | 0x39
  | 0x3a
  | 0x3b
  | 0x3c
  | 0x3d
  | 0x3e
  | 0x3f
  | 0x40
  | 0x41
  | 0x42
  | 0x43
  | 0x44
  | 0x45
  | 0x46
  | 0x47
  | 0x48
  | 0x49
  | 0x4b
  | 0x4c
  | 0x4d
  | 0x4e
  | 0x4f
  | 0x51
  | 0x52
  | 0x53
  | 0x54
  | 0x55
  | 0x56
  | 0x57
  | 0x58
  | 0x59
  | 0x5a
  | 0x5b
  | 0x5c
  | 0x5d
  | 0x5e
  | 0x5f
  | 0x60
  | 0x61
  | 0x62
  | 0x63
  | 0x64
  | 0x65
  | 0x66
  | 0x67
  | 0x68
  | 0x69
  | 0x6a
  | 0x6b
  | 0x6c
  | 0x6d
  | 0x72
  | 0x73
  | 0x74
  | 0x75
  | 0x76
  | 0x77
  | 0x78
  | 0x79
  | 0x7a
  | 0x7b
  | 0x7c
  | 0x7d
  | 0x7e
  | 0x7f
  | 0x80
  | 0x81
  | 0x82
  | 0x83
  | 0x84
  | 0x85
  | 0x86
  | 0x87
  | 0x88
  | 0x89
  | 0x8a
  | 0x8b
  | 0x8c
  | 0x8d
  | 0x8f
  | 0x90
  | 0x91
  | 0x92
  | 0x93
  | 0x94
  | 0x95
  | 0x96
  | 0x97
  | 0x98
  | 0x99
  | 0x9a
  | 0x9b
  | 0x9c
  | 0x9e
  | 0x9f
  | 0xa0
  | 0xa1
  | 0xa2
  | 0xa3
  | 0xa4
  | 0xa5
  | 0xa7
  | 0xa8
  | 0xa9
  | 0xaa
  | 0xac
  | 0xae
  | 0xc0
  | 0xc1
  | 0xc2
  | 0xc3
  | 0xc4
  | 0xc5
  | 0xc6
  | 0xc7
  | 0xc8
  | 0xc9
  | 0xca
  | 0xcb
  | 0xcc
  | 0xcd
  | 0xf0
  | 0xf1;

const OPCODE_PAIRS = [[0x00, 'PUSH0'], [0x01, 'PUSHBYTES1']]
  .concat(
    _.range(0x02, 0x4b).map(idx => [idx, (`PUSHBYTES${idx}`: $FlowFixMe)]),
  )
  .concat([
    [0x4b, 'PUSHBYTES75'],
    [0x4c, 'PUSHDATA1'],
    [0x4d, 'PUSHDATA2'],
    [0x4e, 'PUSHDATA4'],
    [0x4f, 'PUSHM1'],
    [0x51, 'PUSH1'],
    [0x52, 'PUSH2'],
    [0x53, 'PUSH3'],
    [0x54, 'PUSH4'],
    [0x55, 'PUSH5'],
    [0x56, 'PUSH6'],
    [0x57, 'PUSH7'],
    [0x58, 'PUSH8'],
    [0x59, 'PUSH9'],
    [0x5a, 'PUSH10'],
    [0x5b, 'PUSH11'],
    [0x5c, 'PUSH12'],
    [0x5d, 'PUSH13'],
    [0x5e, 'PUSH14'],
    [0x5f, 'PUSH15'],
    [0x60, 'PUSH16'],
    [0x61, 'NOP'],
    [0x62, 'JMP'],
    [0x63, 'JMPIF'],
    [0x64, 'JMPIFNOT'],
    [0x65, 'CALL'],
    [0x66, 'RET'],
    [0x67, 'APPCALL'],
    [0x68, 'SYSCALL'],
    [0x69, 'TAILCALL'],
    [0x6a, 'DUPFROMALTSTACK'],
    [0x6b, 'TOALTSTACK'],
    [0x6c, 'FROMALTSTACK'],
    [0x6d, 'XDROP'],
    [0x72, 'XSWAP'],
    [0x73, 'XTUCK'],
    [0x74, 'DEPTH'],
    [0x75, 'DROP'],
    [0x76, 'DUP'],
    [0x77, 'NIP'],
    [0x78, 'OVER'],
    [0x79, 'PICK'],
    [0x7a, 'ROLL'],
    [0x7b, 'ROT'],
    [0x7c, 'SWAP'],
    [0x7d, 'TUCK'],
    [0x7e, 'CAT'],
    [0x7f, 'SUBSTR'],
    [0x80, 'LEFT'],
    [0x81, 'RIGHT'],
    [0x82, 'SIZE'],
    [0x83, 'INVERT'],
    [0x84, 'AND'],
    [0x85, 'OR'],
    [0x86, 'XOR'],
    [0x87, 'EQUAL'],
    [0x88, 'OP_EQUALVERIFY'],
    [0x89, 'OP_RESERVED1'],
    [0x8a, 'OP_RESERVED2'],
    [0x8b, 'INC'],
    [0x8c, 'DEC'],
    [0x8d, 'SIGN'],
    [0x8f, 'NEGATE'],
    [0x90, 'ABS'],
    [0x91, 'NOT'],
    [0x92, 'NZ'],
    [0x93, 'ADD'],
    [0x94, 'SUB'],
    [0x95, 'MUL'],
    [0x96, 'DIV'],
    [0x97, 'MOD'],
    [0x98, 'SHL'],
    [0x99, 'SHR'],
    [0x9a, 'BOOLAND'],
    [0x9b, 'BOOLOR'],
    [0x9c, 'NUMEQUAL'],
    [0x9e, 'NUMNOTEQUAL'],
    [0x9f, 'LT'],
    [0xa0, 'GT'],
    [0xa1, 'LTE'],
    [0xa2, 'GTE'],
    [0xa3, 'MIN'],
    [0xa4, 'MAX'],
    [0xa5, 'WITHIN'],
    [0xa7, 'SHA1'],
    [0xa8, 'SHA256'],
    [0xa9, 'HASH160'],
    [0xaa, 'HASH256'],
    [0xac, 'CHECKSIG'],
    [0xae, 'CHECKMULTISIG'],
    [0xc0, 'ARRAYSIZE'],
    [0xc1, 'PACK'],
    [0xc2, 'UNPACK'],
    [0xc3, 'PICKITEM'],
    [0xc4, 'SETITEM'],
    [0xc5, 'NEWARRAY'],
    [0xc6, 'NEWSTRUCT'],
    [0xc7, 'NEWMAP'],
    [0xc8, 'APPEND'],
    [0xc9, 'REVERSE'],
    [0xca, 'REMOVE'],
    [0xcb, 'HASKEY'],
    [0xcc, 'KEYS'],
    [0xcd, 'VALUES'],
    [0xf0, 'THROW'],
    [0xf1, 'THROWIFNOT'],
  ]);

export const BYTECODE_TO_OPCODE = _.fromPairs(OPCODE_PAIRS);
export const OPCODE_TO_BYTECODE = (_.mapValues(
  _.invert(BYTECODE_TO_OPCODE),
  val => (parseInt(val, 10): $FlowFixMe),
): { [opCode: OpCode]: ByteCode });

export const SYS_CALL_NAME = {
  RUNTIME_GET_TRIGGER: 'Neo.Runtime.GetTrigger',
  RUNTIME_CHECK_WITNESS: 'Neo.Runtime.CheckWitness',
  RUNTIME_NOTIFY: 'Neo.Runtime.Notify',
  RUNTIME_LOG: 'Neo.Runtime.Log',
  RUNTIME_GET_TIME: 'Neo.Runtime.GetTime',
  RUNTIME_SERIALIZE: 'Neo.Runtime.Serialize',
  RUNTIME_DESERIALIZE: 'Neo.Runtime.Deserialize',
  BLOCKCHAIN_GET_HEIGHT: 'Neo.Blockchain.GetHeight',
  BLOCKCHAIN_GET_HEADER: 'Neo.Blockchain.GetHeader',
  BLOCKCHAIN_GET_BLOCK: 'Neo.Blockchain.GetBlock',
  BLOCKCHAIN_GET_TRANSACTION: 'Neo.Blockchain.GetTransaction',
  BLOCKCHAIN_GET_ACCOUNT: 'Neo.Blockchain.GetAccount',
  BLOCKCHAIN_GET_VALIDATORS: 'Neo.Blockchain.GetValidators',
  BLOCKCHAIN_GET_ASSET: 'Neo.Blockchain.GetAsset',
  BLOCKCHAIN_GET_CONTRACT: 'Neo.Blockchain.GetContract',
  HEADER_GET_HASH: 'Neo.Header.GetHash',
  HEADER_GET_INDEX: 'Neo.Header.GetIndex',
  HEADER_GET_VERSION: 'Neo.Header.GetVersion',
  HEADER_GET_PREVHASH: 'Neo.Header.GetPrevHash',
  HEADER_GET_MERKLEROOT: 'Neo.Header.GetMerkleRoot',
  HEADER_GET_TIMESTAMP: 'Neo.Header.GetTimestamp',
  HEADER_GET_CONSENSUSDATA: 'Neo.Header.GetConsensusData',
  HEADER_GET_NEXTCONSENSUS: 'Neo.Header.GetNextConsensus',
  BLOCK_GET_TRANSACTIONCOUNT: 'Neo.Block.GetTransactionCount',
  BLOCK_GET_TRANSACTIONS: 'Neo.Block.GetTransactions',
  BLOCK_GET_TRANSACTION: 'Neo.Block.GetTransaction',
  TRANSACTION_GET_HASH: 'Neo.Transaction.GetHash',
  TRANSACTION_GET_TYPE: 'Neo.Transaction.GetType',
  TRANSACTION_GET_ATTRIBUTES: 'Neo.Transaction.GetAttributes',
  TRANSACTION_GET_INPUTS: 'Neo.Transaction.GetInputs',
  TRANSACTION_GET_OUTPUTS: 'Neo.Transaction.GetOutputs',
  TRANSACTION_GET_REFERENCES: 'Neo.Transaction.GetReferences',
  TRANSACTION_GET_UNSPENT_COINS: 'Neo.Transaction.GetUnspentCoins',
  INVOCATION_TRANSACTION_GET_SCRIPT: 'Neo.InvocationTransaction.GetScript',
  ATTRIBUTE_GET_USAGE: 'Neo.Attribute.GetUsage',
  ATTRIBUTE_GET_DATA: 'Neo.Attribute.GetData',
  INPUT_GET_HASH: 'Neo.Input.GetHash',
  INPUT_GET_INDEX: 'Neo.Input.GetIndex',
  OUTPUT_GET_ASSETID: 'Neo.Output.GetAssetId',
  OUTPUT_GET_VALUE: 'Neo.Output.GetValue',
  OUTPUT_GET_SCRIPTHASH: 'Neo.Output.GetScriptHash',
  ACCOUNT_GET_SCRIPTHASH: 'Neo.Account.GetScriptHash',
  ACCOUNT_GET_VOTES: 'Neo.Account.GetVotes',
  ACCOUNT_GET_BALANCE: 'Neo.Account.GetBalance',
  ASSET_GET_ASSETID: 'Neo.Asset.GetAssetId',
  ASSET_GET_ASSETTYPE: 'Neo.Asset.GetAssetType',
  ASSET_GET_AMOUNT: 'Neo.Asset.GetAmount',
  ASSET_GET_AVAILABLE: 'Neo.Asset.GetAvailable',
  ASSET_GET_PRECISION: 'Neo.Asset.GetPrecision',
  ASSET_GET_OWNER: 'Neo.Asset.GetOwner',
  ASSET_GET_ADMIN: 'Neo.Asset.GetAdmin',
  ASSET_GET_ISSUER: 'Neo.Asset.GetIssuer',
  CONTRACT_GET_SCRIPT: 'Neo.Contract.GetScript',
  STORAGE_GET_CONTEXT: 'Neo.Storage.GetContext',
  STORAGE_GET: 'Neo.Storage.Get',
  STORAGE_FIND: 'Neo.Storage.Find',
  ITERATOR_NEXT: 'Neo.Iterator.Next',
  ITERATOR_KEY: 'Neo.Iterator.Key',
  ITERATOR_VALUE: 'Neo.Iterator.Value',
  ACCOUNT_SET_VOTES: 'Neo.Account.SetVotes',
  VALIDATOR_REGISTER: 'Neo.Validator.Register',
  ASSET_CREATE: 'Neo.Asset.Create',
  ASSET_RENEW: 'Neo.Asset.Renew',
  CONTRACT_CREATE: 'Neo.Contract.Create',
  CONTRACT_MIGRATE_: 'Neo.Contract.Migrate',
  CONTRACT_GET_STORAGE_CONTEXT: 'Neo.Contract.GetStorageContext',
  CONTRACT_DESTROY: 'Neo.Contract.Destroy',
  STORAGE_PUT: 'Neo.Storage.Put',
  STORAGE_DELETE: 'Neo.Storage.Delete',
  EXECUTION_ENGINE_GET_SCRIPT_CONTAINER:
    'System.ExecutionEngine.GetScriptContainer',
  EXECUTION_ENGINE_GET_EXECUTING_SCRIPT_HASH:
    'System.ExecutionEngine.GetExecutingScriptHash',
  EXECUTION_ENGINE_GET_CALLING_SCRIPT_HASH:
    'System.ExecutionEngine.GetCallingScriptHash',
  EXECUTION_ENGINE_GET_ENTRY_SCRIPT_HASH:
    'System.ExecutionEngine.GetEntryScriptHash',
};

export class InvalidSysCallNameError extends CustomError {
  static code = 'INVALID_SYS_CALL_NAME';
  code = this.constructor.code;
  value: string;

  constructor(value: string) {
    super(`Expected sys call name, found: ${value}`);
    this.value = value;
  }
}

export type SysCallName =
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

export const assertSysCallName = (value: string): SysCallName => {
  switch (value) {
    case SYS_CALL_NAME.RUNTIME_GET_TRIGGER:
      return SYS_CALL_NAME.RUNTIME_GET_TRIGGER;
    case SYS_CALL_NAME.RUNTIME_CHECK_WITNESS:
      return SYS_CALL_NAME.RUNTIME_CHECK_WITNESS;
    case SYS_CALL_NAME.RUNTIME_NOTIFY:
      return SYS_CALL_NAME.RUNTIME_NOTIFY;
    case SYS_CALL_NAME.RUNTIME_LOG:
      return SYS_CALL_NAME.RUNTIME_LOG;
    case SYS_CALL_NAME.RUNTIME_GET_TIME:
      return SYS_CALL_NAME.RUNTIME_GET_TIME;
    case SYS_CALL_NAME.RUNTIME_SERIALIZE:
      return SYS_CALL_NAME.RUNTIME_SERIALIZE;
    case SYS_CALL_NAME.RUNTIME_DESERIALIZE:
      return SYS_CALL_NAME.RUNTIME_DESERIALIZE;
    case SYS_CALL_NAME.BLOCKCHAIN_GET_HEIGHT:
      return SYS_CALL_NAME.BLOCKCHAIN_GET_HEIGHT;
    case SYS_CALL_NAME.BLOCKCHAIN_GET_HEADER:
      return SYS_CALL_NAME.BLOCKCHAIN_GET_HEADER;
    case SYS_CALL_NAME.BLOCKCHAIN_GET_BLOCK:
      return SYS_CALL_NAME.BLOCKCHAIN_GET_BLOCK;
    case SYS_CALL_NAME.BLOCKCHAIN_GET_TRANSACTION:
      return SYS_CALL_NAME.BLOCKCHAIN_GET_TRANSACTION;
    case SYS_CALL_NAME.BLOCKCHAIN_GET_ACCOUNT:
      return SYS_CALL_NAME.BLOCKCHAIN_GET_ACCOUNT;
    case SYS_CALL_NAME.BLOCKCHAIN_GET_VALIDATORS:
      return SYS_CALL_NAME.BLOCKCHAIN_GET_VALIDATORS;
    case SYS_CALL_NAME.BLOCKCHAIN_GET_ASSET:
      return SYS_CALL_NAME.BLOCKCHAIN_GET_ASSET;
    case SYS_CALL_NAME.BLOCKCHAIN_GET_CONTRACT:
      return SYS_CALL_NAME.BLOCKCHAIN_GET_CONTRACT;
    case SYS_CALL_NAME.HEADER_GET_HASH:
      return SYS_CALL_NAME.HEADER_GET_HASH;
    case SYS_CALL_NAME.HEADER_GET_VERSION:
      return SYS_CALL_NAME.HEADER_GET_VERSION;
    case SYS_CALL_NAME.HEADER_GET_PREVHASH:
      return SYS_CALL_NAME.HEADER_GET_PREVHASH;
    case SYS_CALL_NAME.HEADER_GET_INDEX:
      return SYS_CALL_NAME.HEADER_GET_INDEX;
    case SYS_CALL_NAME.HEADER_GET_MERKLEROOT:
      return SYS_CALL_NAME.HEADER_GET_MERKLEROOT;
    case SYS_CALL_NAME.HEADER_GET_TIMESTAMP:
      return SYS_CALL_NAME.HEADER_GET_TIMESTAMP;
    case SYS_CALL_NAME.HEADER_GET_CONSENSUSDATA:
      return SYS_CALL_NAME.HEADER_GET_CONSENSUSDATA;
    case SYS_CALL_NAME.HEADER_GET_NEXTCONSENSUS:
      return SYS_CALL_NAME.HEADER_GET_NEXTCONSENSUS;
    case SYS_CALL_NAME.BLOCK_GET_TRANSACTIONCOUNT:
      return SYS_CALL_NAME.BLOCK_GET_TRANSACTIONCOUNT;
    case SYS_CALL_NAME.BLOCK_GET_TRANSACTIONS:
      return SYS_CALL_NAME.BLOCK_GET_TRANSACTIONS;
    case SYS_CALL_NAME.BLOCK_GET_TRANSACTION:
      return SYS_CALL_NAME.BLOCK_GET_TRANSACTION;
    case SYS_CALL_NAME.TRANSACTION_GET_HASH:
      return SYS_CALL_NAME.TRANSACTION_GET_HASH;
    case SYS_CALL_NAME.TRANSACTION_GET_TYPE:
      return SYS_CALL_NAME.TRANSACTION_GET_TYPE;
    case SYS_CALL_NAME.TRANSACTION_GET_ATTRIBUTES:
      return SYS_CALL_NAME.TRANSACTION_GET_ATTRIBUTES;
    case SYS_CALL_NAME.TRANSACTION_GET_INPUTS:
      return SYS_CALL_NAME.TRANSACTION_GET_INPUTS;
    case SYS_CALL_NAME.TRANSACTION_GET_OUTPUTS:
      return SYS_CALL_NAME.TRANSACTION_GET_OUTPUTS;
    case SYS_CALL_NAME.TRANSACTION_GET_REFERENCES:
      return SYS_CALL_NAME.TRANSACTION_GET_REFERENCES;
    case SYS_CALL_NAME.TRANSACTION_GET_UNSPENT_COINS:
      return SYS_CALL_NAME.TRANSACTION_GET_UNSPENT_COINS;
    case SYS_CALL_NAME.INVOCATION_TRANSACTION_GET_SCRIPT:
      return SYS_CALL_NAME.INVOCATION_TRANSACTION_GET_SCRIPT;
    case SYS_CALL_NAME.ATTRIBUTE_GET_USAGE:
      return SYS_CALL_NAME.ATTRIBUTE_GET_USAGE;
    case SYS_CALL_NAME.ATTRIBUTE_GET_DATA:
      return SYS_CALL_NAME.ATTRIBUTE_GET_DATA;
    case SYS_CALL_NAME.INPUT_GET_HASH:
      return SYS_CALL_NAME.INPUT_GET_HASH;
    case SYS_CALL_NAME.INPUT_GET_INDEX:
      return SYS_CALL_NAME.INPUT_GET_INDEX;
    case SYS_CALL_NAME.OUTPUT_GET_ASSETID:
      return SYS_CALL_NAME.OUTPUT_GET_ASSETID;
    case SYS_CALL_NAME.OUTPUT_GET_VALUE:
      return SYS_CALL_NAME.OUTPUT_GET_VALUE;
    case SYS_CALL_NAME.OUTPUT_GET_SCRIPTHASH:
      return SYS_CALL_NAME.OUTPUT_GET_SCRIPTHASH;
    case SYS_CALL_NAME.ACCOUNT_GET_SCRIPTHASH:
      return SYS_CALL_NAME.ACCOUNT_GET_SCRIPTHASH;
    case SYS_CALL_NAME.ACCOUNT_GET_VOTES:
      return SYS_CALL_NAME.ACCOUNT_GET_VOTES;
    case SYS_CALL_NAME.ACCOUNT_GET_BALANCE:
      return SYS_CALL_NAME.ACCOUNT_GET_BALANCE;
    case SYS_CALL_NAME.ASSET_GET_ASSETID:
      return SYS_CALL_NAME.ASSET_GET_ASSETID;
    case SYS_CALL_NAME.ASSET_GET_ASSETTYPE:
      return SYS_CALL_NAME.ASSET_GET_ASSETTYPE;
    case SYS_CALL_NAME.ASSET_GET_AMOUNT:
      return SYS_CALL_NAME.ASSET_GET_AMOUNT;
    case SYS_CALL_NAME.ASSET_GET_AVAILABLE:
      return SYS_CALL_NAME.ASSET_GET_AVAILABLE;
    case SYS_CALL_NAME.ASSET_GET_PRECISION:
      return SYS_CALL_NAME.ASSET_GET_PRECISION;
    case SYS_CALL_NAME.ASSET_GET_OWNER:
      return SYS_CALL_NAME.ASSET_GET_OWNER;
    case SYS_CALL_NAME.ASSET_GET_ADMIN:
      return SYS_CALL_NAME.ASSET_GET_ADMIN;
    case SYS_CALL_NAME.ASSET_GET_ISSUER:
      return SYS_CALL_NAME.ASSET_GET_ISSUER;
    case SYS_CALL_NAME.CONTRACT_GET_SCRIPT:
      return SYS_CALL_NAME.CONTRACT_GET_SCRIPT;
    case SYS_CALL_NAME.STORAGE_GET_CONTEXT:
      return SYS_CALL_NAME.STORAGE_GET_CONTEXT;
    case SYS_CALL_NAME.STORAGE_GET:
      return SYS_CALL_NAME.STORAGE_GET;
    case SYS_CALL_NAME.STORAGE_FIND:
      return SYS_CALL_NAME.STORAGE_FIND;
    case SYS_CALL_NAME.ITERATOR_NEXT:
      return SYS_CALL_NAME.ITERATOR_NEXT;
    case SYS_CALL_NAME.ITERATOR_KEY:
      return SYS_CALL_NAME.ITERATOR_KEY;
    case SYS_CALL_NAME.ITERATOR_VALUE:
      return SYS_CALL_NAME.ITERATOR_VALUE;
    case SYS_CALL_NAME.ACCOUNT_SET_VOTES:
      return SYS_CALL_NAME.ACCOUNT_SET_VOTES;
    case SYS_CALL_NAME.VALIDATOR_REGISTER:
      return SYS_CALL_NAME.VALIDATOR_REGISTER;
    case SYS_CALL_NAME.ASSET_CREATE:
      return SYS_CALL_NAME.ASSET_CREATE;
    case SYS_CALL_NAME.ASSET_RENEW:
      return SYS_CALL_NAME.ASSET_RENEW;
    case SYS_CALL_NAME.CONTRACT_CREATE:
      return SYS_CALL_NAME.CONTRACT_CREATE;
    case SYS_CALL_NAME.CONTRACT_MIGRATE_:
      return SYS_CALL_NAME.CONTRACT_MIGRATE_;
    case SYS_CALL_NAME.CONTRACT_GET_STORAGE_CONTEXT:
      return SYS_CALL_NAME.CONTRACT_GET_STORAGE_CONTEXT;
    case SYS_CALL_NAME.CONTRACT_DESTROY:
      return SYS_CALL_NAME.CONTRACT_DESTROY;
    case SYS_CALL_NAME.STORAGE_PUT:
      return SYS_CALL_NAME.STORAGE_PUT;
    case SYS_CALL_NAME.STORAGE_DELETE:
      return SYS_CALL_NAME.STORAGE_DELETE;
    case SYS_CALL_NAME.EXECUTION_ENGINE_GET_SCRIPT_CONTAINER:
      return SYS_CALL_NAME.EXECUTION_ENGINE_GET_SCRIPT_CONTAINER;
    case SYS_CALL_NAME.EXECUTION_ENGINE_GET_EXECUTING_SCRIPT_HASH:
      return SYS_CALL_NAME.EXECUTION_ENGINE_GET_EXECUTING_SCRIPT_HASH;
    case SYS_CALL_NAME.EXECUTION_ENGINE_GET_CALLING_SCRIPT_HASH:
      return SYS_CALL_NAME.EXECUTION_ENGINE_GET_CALLING_SCRIPT_HASH;
    case SYS_CALL_NAME.EXECUTION_ENGINE_GET_ENTRY_SCRIPT_HASH:
      return SYS_CALL_NAME.EXECUTION_ENGINE_GET_ENTRY_SCRIPT_HASH;
    default:
      throw new InvalidSysCallNameError(value);
  }
};

export class InvalidVMStateError extends CustomError {
  static code = 'INVALID_VM_STATE';
  code = this.constructor.code;

  constructor(state: number) {
    super(`Invalid VM State: ${state}`);
  }
}

export const VM_STATE = {
  NONE: 0x00,
  HALT: 0x01,
  FAULT: 0x02,
  BREAK: 0x04,
};

export type VMStateNone = 0x00;
export type VMStateHalt = 0x01;
export type VMStateFault = 0x02;
export type VMStateBreak = 0x04;

export type VMState =
  | VMStateNone // NONE
  | VMStateHalt // HALT
  | VMStateFault // FAULT
  | VMStateBreak; // BREAK

export const assertVMState = (state: number): VMState => {
  switch (state) {
    case 0x00:
      return 0x00;
    case 0x01:
      return 0x01;
    case 0x02:
      return 0x02;
    case 0x04:
      return 0x04;
    default:
      throw new InvalidVMStateError(state);
  }
};
