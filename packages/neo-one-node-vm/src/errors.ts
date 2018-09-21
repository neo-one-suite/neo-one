import { common, disassembleByteCode, OpCode } from '@neo-one/client-core';
import { makeErrorWithCode } from '@neo-one/utils';
import BN from 'bn.js';
import { ExecutionContext } from './constants';

const getLine = (context: ExecutionContext): number => {
  const bytecode = disassembleByteCode(context.code);
  // tslint:disable-next-line no-unused
  const result = [...bytecode.entries()].find(([idx, { pc }]) => context.pc === pc);

  // NOTE: We don't do result[0] + 1 because context.pc will be the next pc, not the one that
  //       the error was thrown on. (Line numbers are 1-indexed)
  return result === undefined ? 1 : result[0];
};

const getMessage = (context: ExecutionContext, message: string): string => {
  const { pc } = context;
  const stack = context.stack.map((item) => item.toString()).join('\n');

  return `${message}\nPC:${pc}\nStack:\n${stack}\nLine:${getLine(context)}\nScript Hash:${common.uInt160ToString(
    context.scriptHash,
  )}`;
};

export const ThrowError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Script execution threw an Error'),
);
export const UnknownOpError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext, byteCode: string) =>
  getMessage(context, `Unknown op: ${byteCode}`),
);
export const StackUnderflowError = makeErrorWithCode(
  'VM_ERROR',
  (context: ExecutionContext, op: OpCode, stackLength: number, expected: number) =>
    getMessage(context, `Stack Underflow. Op: ${op}. Stack Length: ${stackLength}. ` + `Expected: ${expected}`),
);
export const NumberTooLargeError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext, value: BN) =>
  getMessage(context, `Number too large to be represented in Javascript: ${value.toString(10)}`),
);
export const AltStackUnderflowError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, `Stack Underflow.`),
);
export const StackOverflowError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Stack Overflow'),
);
export const InvocationStackOverflowError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Invocation Stack Overflow'),
);
export const ArrayOverflowError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Array Overflow'),
);
export const ItemOverflowError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Item Overflow'),
);
export const OutOfGASError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Out of GAS'),
);
export const CodeOverflowError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Code Overflow'),
);
export const UnknownSysCallError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext, sysCall: string) =>
  getMessage(context, `Unknown SysCall: ${sysCall}`),
);
export const UnknownOPError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Unnown Op'),
);
export const UnknownError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Unknown Error'),
);
export const XTuckNegativeError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'XTUCK Negative Index'),
);
export const XSwapNegativeError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'XSWAP Negative Index'),
);
export const XDropNegativeError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'XDROP Negative Index'),
);
export const PickNegativeError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'PICK Negative Index'),
);
export const RollNegativeError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'ROLL Negative Index'),
);
export const SubstrNegativeEndError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'SUBSTR Negative End'),
);
export const SubstrNegativeStartError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'SUBSTR Negative Start'),
);
export const LeftNegativeError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'LEFT Negative Index'),
);
export const RightNegativeError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'RIGHT Negative Index'),
);
export const RightLengthError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'RIGHT Length Less Than Index'),
);
export const InvalidAssetTypeError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Invalid Asset Type.'),
);
export const InvalidCheckMultisigArgumentsError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Invalid CHECKMULTISIG Arguments'),
);
export const InvalidPackCountError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Invalid PACK Count'),
);
export const InvalidPickItemKeyError = makeErrorWithCode(
  'VM_ERROR',
  (context: ExecutionContext, key: string, value: string) =>
    getMessage(context, `Invalid PICKITEM Index: ${key}. Value: ${value}`),
);
export const InvalidRemoveIndexError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext, index: number) =>
  getMessage(context, `Invalid REMOVE Index: ${index}`),
);
export const InvalidHasKeyIndexError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Invalid HASKEY Index'),
);
export const InvalidSetItemIndexError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Invalid SETITEM Index'),
);
export const InvalidCheckWitnessArgumentsError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Invalid CheckWitness Arguments'),
);
export const InvalidGetHeaderArgumentsError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Invalid GETHEADER Arguments'),
);
export const InvalidGetBlockArgumentsError = makeErrorWithCode(
  'VM_ERROR',
  (context: ExecutionContext, arg: Buffer | undefined) =>
    getMessage(context, `Invalid GETBLOCK Argument: ` + `${arg === undefined ? 'null' : arg.toString('hex')}`),
);
export const InvalidIndexError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Invalid Index.'),
);
export const InvalidInvocationTransactionError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Expected InvocationTransaction.'),
);
export const InvalidClaimTransactionError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Expected ClaimTransaction.'),
);
export const ContractNoStorageError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext, hash: string) =>
  getMessage(context, `Contract Does Not Have Storage: ${hash}`),
);
export const ContractNoDynamicInvokeError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext, hash: string) =>
  getMessage(context, `Contract Does Not Have Dynamic Invoke: ${hash}`),
);
export const TooManyVotesError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Too Many Votes'),
);
export const AccountFrozenError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Account Frozen'),
);
export const NotEligibleVoteError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Ineligible To Vote'),
);
export const BadWitnessCheckError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Bad Witness'),
);
export const UnexpectedScriptContainerError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Unexpected Script Container'),
);
export const InvalidGetStorageContextError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Invalid Get Storage Context'),
);
export const InvalidContractGetStorageContextError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'Invalid Contract.GetStorageContext context'),
);
export const ReadOnlyStorageContextError = makeErrorWithCode('VM_ERROR', (context: ExecutionContext) =>
  getMessage(context, 'StorageContext is read only'),
);
export const InsufficientReturnValueError = makeErrorWithCode(
  'VM_ERROR',
  (context: ExecutionContext, stackSize: number, count: number) =>
    getMessage(context, `Insufficient return values. Found ${stackSize}, expected ${count}`),
);
export const InvalidTailCallReturnValueError = makeErrorWithCode(
  'VM_ERROR',
  (context: ExecutionContext, found: number, expected: number) =>
    getMessage(context, `Invalid tail call return value count. Found ${found}, expected ${expected}`),
);

export const TemplateVMError = makeErrorWithCode('VM_ERROR', getMessage);
