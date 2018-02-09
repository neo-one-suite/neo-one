/* @flow */
import type BN from 'bn.js';
import { CustomError } from '@neo-one/utils';
import { type OpCode, disassembleByteCode } from '@neo-one/client-core';

import { type ExecutionContext } from './constants';

export class VMError extends CustomError {
  code = 'VM_ERROR';

  constructor(context: ExecutionContext, message: string) {
    const debug = disassembleByteCode(context.code).join('\n');
    const stack = context.stack.map(item => item.toString()).join('\n');
    const { pc } = context;
    super(`${message}\nPC: ${pc}\nCode:\n${debug}\nStack:\n${stack}`);
  }
}

export class ThrowError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Script execution threw an Error');
  }
}

export class UnknownOpError extends VMError {
  byteCode: string;

  constructor(context: ExecutionContext, byteCode: string) {
    super(context, `Unknown op: ${byteCode}`);
    this.byteCode = byteCode;
  }
}

export class PushOnlyError extends VMError {
  byteCode: number;

  constructor(context: ExecutionContext, byteCode: number) {
    super(context, `Push only mode, found non-push byte code: ${byteCode}`);
    this.byteCode = byteCode;
  }
}

export class StackUnderflowError extends VMError {
  constructor(
    context: ExecutionContext,
    op: OpCode,
    stackLength: number,
    expected: number,
  ) {
    super(
      context,
      `Stack Underflow. Op: ${op}. Stack Length: ${stackLength}. ` +
        `Expected: ${expected}`,
    );
  }
}

export class NumberTooLargeError extends VMError {
  constructor(context: ExecutionContext, value: BN) {
    super(
      context,
      `Number too large to be represented in Javascript: ${value.toString(10)}`,
    );
  }
}

export class AltStackUnderflowError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, `Stack Underflow.`);
  }
}

export class StackOverflowError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Stack Overflow');
  }
}

export class InvocationStackOverflowError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Invocation Stack Overflow');
  }
}

export class ArrayOverflowError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Array Overflow');
  }
}

export class ItemOverflowError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Item Overflow');
  }
}

export class OutOfGASError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Out of GAS');
  }
}

export class CodeOverflowError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Code Overflow');
  }
}

export class UnknownSysCallError extends VMError {
  sysCall: string;

  constructor(context: ExecutionContext, sysCall: string) {
    super(context, `Unknown SysCall: ${sysCall}`);
    this.sysCall = sysCall;
  }
}

export class UnknownOPError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Unnown Op');
  }
}

export class UnknownError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Unknown Error');
  }
}

export class XTuckNegativeError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'XTUCK Negative Index');
  }
}

export class XSwapNegativeError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'XSWAP Negative Index');
  }
}

export class XDropNegativeError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'XDROP Negative Index');
  }
}

export class PickNegativeError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'PICK Negative Index');
  }
}

export class RollNegativeError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'ROLL Negative Index');
  }
}

export class SubstrNegativeEndError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'SUBSTR Negative End');
  }
}

export class SubstrNegativeStartError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'SUBSTR Negative Start');
  }
}

export class LeftNegativeError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'LEFT Negative Index');
  }
}

export class RightNegativeError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'RIGHT Negative Index');
  }
}

export class RightLengthError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'RIGHT Length Less Than Index');
  }
}

export class InvalidAssetTypeError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Invalid Asset Type.');
  }
}

export class InvalidCheckMultisigArgumentsError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Invalid CHECKMULTISIG Arguments');
  }
}

export class InvalidPackCountError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Invalid PACK Count');
  }
}

export class InvalidPickItemKeyError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Invalid PICKITEM Index');
  }
}

export class InvalidRemoveIndexError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Invalid REMOVE Index');
  }
}

export class InvalidHasKeyIndexError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Invalid HASKEY Index');
  }
}

export class InvalidSetItemIndexError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Invalid SETITEM Index');
  }
}

export class InvalidCheckWitnessArgumentsError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Invalid CheckWitness Arguments');
  }
}

export class InvalidGetHeaderArgumentsError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Invalid GETHEADER Arguments');
  }
}

export class InvalidGetBlockArgumentsError extends VMError {
  constructor(context: ExecutionContext, arg: ?Buffer) {
    super(
      context,
      `Invalid GETBLOCK Argument: ` +
        `${arg == null ? 'null' : arg.toString('hex')}`,
    );
  }
}

export class InvalidIndexError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Invalid Index.');
  }
}

export class InvalidInvocationTransactionError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Expected InvocationTransaction.');
  }
}

export class ContractNoStorageError extends VMError {
  constructor(context: ExecutionContext, hash: string) {
    super(context, `Contract Does Not Have Storage: ${hash}`);
  }
}

export class ContractNoDynamicInvokeError extends VMError {
  constructor(context: ExecutionContext, hash: string) {
    super(context, `Contract Does Not Have Dynamic Invoke: ${hash}`);
  }
}

export class TooManyVotesError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Too Many Votes');
  }
}

export class AccountFrozenError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Account Frozen');
  }
}

export class NotEligibleVoteError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Ineligible To Vote');
  }
}

export class BadWitnessCheckError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Bad Witness');
  }
}

export class UnexpectedScriptContainerError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Unexpected Script Container');
  }
}

export class InvalidGetStorageContextError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Invalid Get Storage Context');
  }
}

export class InvalidContractGetStorageContextError extends VMError {
  constructor(context: ExecutionContext) {
    super(context, 'Invalid Contract.GetStorageContext context');
  }
}
