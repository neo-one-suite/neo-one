import { disassembleByteCode, OpCode } from '@neo-one/client-core';
import { CustomError } from '@neo-one/utils';
import BN from 'bn.js';
import { ExecutionContext } from './constants';

const getMessage = (context: ExecutionContext, message: string): string => {
  const debug = disassembleByteCode(context.code).join('\n');
  const stack = context.stack.map((item) => item.toString()).join('\n');
  const { pc } = context;

  return `${message}\nPC: ${pc}\nCode:\n${debug}\nStack:\n${stack}`;
};

export class VMError extends CustomError {
  public readonly code = 'VM_ERROR';

  public constructor(context: ExecutionContext, message: string) {
    super(getMessage(context, message));
  }
}

export class ThrowError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Script execution threw an Error');
  }
}

export class UnknownOpError extends VMError {
  public readonly byteCode: string;

  public constructor(context: ExecutionContext, byteCode: string) {
    super(context, `Unknown op: ${byteCode}`);
    this.byteCode = byteCode;
  }
}

export class PushOnlyError extends VMError {
  public readonly byteCode: number;

  public constructor(context: ExecutionContext, byteCode: number) {
    super(context, `Push only mode, found non-push byte code: ${byteCode}`);
    this.byteCode = byteCode;
  }
}

export class StackUnderflowError extends VMError {
  public constructor(context: ExecutionContext, op: OpCode, stackLength: number, expected: number) {
    super(context, `Stack Underflow. Op: ${op}. Stack Length: ${stackLength}. ` + `Expected: ${expected}`);
  }
}

export class NumberTooLargeError extends VMError {
  public constructor(context: ExecutionContext, value: BN) {
    super(context, `Number too large to be represented in Javascript: ${value.toString(10)}`);
  }
}

export class AltStackUnderflowError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, `Stack Underflow.`);
  }
}

export class StackOverflowError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Stack Overflow');
  }
}

export class InvocationStackOverflowError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Invocation Stack Overflow');
  }
}

export class ArrayOverflowError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Array Overflow');
  }
}

export class ItemOverflowError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Item Overflow');
  }
}

export class OutOfGASError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Out of GAS');
  }
}

export class CodeOverflowError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Code Overflow');
  }
}

export class UnknownSysCallError extends VMError {
  public readonly sysCall: string;

  public constructor(context: ExecutionContext, sysCall: string) {
    super(context, `Unknown SysCall: ${sysCall}`);
    this.sysCall = sysCall;
  }
}

export class UnknownOPError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Unnown Op');
  }
}

export class UnknownError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Unknown Error');
  }
}

export class XTuckNegativeError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'XTUCK Negative Index');
  }
}

export class XSwapNegativeError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'XSWAP Negative Index');
  }
}

export class XDropNegativeError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'XDROP Negative Index');
  }
}

export class PickNegativeError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'PICK Negative Index');
  }
}

export class RollNegativeError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'ROLL Negative Index');
  }
}

export class SubstrNegativeEndError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'SUBSTR Negative End');
  }
}

export class SubstrNegativeStartError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'SUBSTR Negative Start');
  }
}

export class LeftNegativeError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'LEFT Negative Index');
  }
}

export class RightNegativeError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'RIGHT Negative Index');
  }
}

export class RightLengthError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'RIGHT Length Less Than Index');
  }
}

export class InvalidAssetTypeError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Invalid Asset Type.');
  }
}

export class InvalidCheckMultisigArgumentsError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Invalid CHECKMULTISIG Arguments');
  }
}

export class InvalidPackCountError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Invalid PACK Count');
  }
}

export class InvalidPickItemKeyError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Invalid PICKITEM Index');
  }
}

export class InvalidRemoveIndexError extends VMError {
  public constructor(context: ExecutionContext, index: number) {
    super(context, `Invalid REMOVE Index: ${index}`);
  }
}

export class InvalidHasKeyIndexError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Invalid HASKEY Index');
  }
}

export class InvalidSetItemIndexError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Invalid SETITEM Index');
  }
}

export class InvalidCheckWitnessArgumentsError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Invalid CheckWitness Arguments');
  }
}

export class InvalidGetHeaderArgumentsError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Invalid GETHEADER Arguments');
  }
}

export class InvalidGetBlockArgumentsError extends VMError {
  public constructor(context: ExecutionContext, arg: Buffer | undefined) {
    super(context, `Invalid GETBLOCK Argument: ` + `${arg === undefined ? 'null' : arg.toString('hex')}`);
  }
}

export class InvalidIndexError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Invalid Index.');
  }
}

export class InvalidInvocationTransactionError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Expected InvocationTransaction.');
  }
}

export class ContractNoStorageError extends VMError {
  public constructor(context: ExecutionContext, hash: string) {
    super(context, `Contract Does Not Have Storage: ${hash}`);
  }
}

export class ContractNoDynamicInvokeError extends VMError {
  public constructor(context: ExecutionContext, hash: string) {
    super(context, `Contract Does Not Have Dynamic Invoke: ${hash}`);
  }
}

export class TooManyVotesError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Too Many Votes');
  }
}

export class AccountFrozenError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Account Frozen');
  }
}

export class NotEligibleVoteError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Ineligible To Vote');
  }
}

export class BadWitnessCheckError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Bad Witness');
  }
}

export class UnexpectedScriptContainerError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Unexpected Script Container');
  }
}

export class InvalidGetStorageContextError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Invalid Get Storage Context');
  }
}

export class InvalidContractGetStorageContextError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'Invalid Contract.GetStorageContext context');
  }
}

export class ReadOnlyStorageContextError extends VMError {
  public constructor(context: ExecutionContext) {
    super(context, 'StorageContext is read only');
  }
}
