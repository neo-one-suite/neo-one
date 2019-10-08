/// <reference types="@reactivex/ix-es2015-cjs" />
import {
  assertContractParameterType,
  assertStorageFlags,
  assertSysCall,
  common,
  crypto,
  ECPoint,
  hasStorageFlag,
  isContractParameterType,
  SysCall as SysCallEnum,
  SysCallHash,
  SysCallName,
  toSysCallHash,
  UInt160,
  UInt256,
} from '@neo-one/client-common';
import { assertContractPropertyState, HasDynamicInvoke, HasStorage } from '@neo-one/client-full-common';
import {
  BinaryReader,
  Contract,
  InvocationTransaction,
  ScriptContainerType,
  StorageFlags,
  StorageItem,
  TriggerType,
  utils,
  Witness,
} from '@neo-one/node-core';
import { utils as commonUtils } from '@neo-one/utils';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { map as asyncMap } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/map';
import { BN } from 'bn.js';
import _ from 'lodash';
import { defer } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { ExecutionContext, FEES, MAX_ARRAY_SIZE, MAX_ITEM_SIZE, OpInvoke, OpInvokeArgs, SysCall } from './constants';
import {
  ConstantStorageError,
  ContainerTooLargeError,
  ContractNoStorageError,
  InvalidCheckMultisigArgumentsError,
  InvalidGetBlockArgumentsError,
  InvalidGetHeaderArgumentsError,
  InvalidIndexError,
  InvalidInvocationCounterError,
  InvalidInvocationTransactionError,
  InvalidNativeDeployError,
  InvalidVerifySyscallError,
  ItemTooLargeError,
  StackUnderflowError,
  UnknownSysCallError,
} from './errors';
import {
  ArrayStackItem,
  BlockStackItem,
  BooleanStackItem,
  BufferStackItem,
  ConsensusPayloadStackItem,
  ContractStackItem,
  deserializeStackItem,
  EnumeratorStackItem,
  HeaderStackItem,
  IntegerStackItem,
  IteratorStackItem,
  StackItem,
  StackItemEnumerator,
  StackItemIterator,
  StorageContextStackItem,
  TransactionStackItem,
  UInt160StackItem,
  UInt256StackItem,
  WitnessStackItem,
} from './stackItem';
import { vmUtils } from './vmUtils';

export interface CreateSysCallArgs {
  readonly context: ExecutionContext;
}
export type CreateSysCall = (input: CreateSysCallArgs) => SysCall;

export const createSysCall = ({
  name,
  fee,
  in: _in = 0,
  inAlt = 0,
  out = 0,
  outAlt = 0,
  invocation = 0,
  invoke,
}: {
  readonly name: SysCallName;
  readonly fee: BN;
  readonly in?: number;
  readonly inAlt?: number;
  readonly out?: number;
  readonly outAlt?: number;
  readonly invocation?: number;
  readonly invoke: OpInvoke;
}): CreateSysCall => ({ context }) => ({
  context,
  name,
  in: _in,
  inAlt,
  out,
  outAlt,
  invocation,
  fee,
  invoke,
});

const getHashOrIndex = ({
  context,
  arg,
}: {
  readonly context: ExecutionContext;
  readonly arg: StackItem;
}): UInt256 | number | undefined => {
  const buffer = arg.asBuffer();
  let hashOrIndex;
  if (buffer.length === 32) {
    hashOrIndex = arg.asUInt256();
  } else if (buffer.length <= 5) {
    hashOrIndex = arg.asBigInteger(context.blockchain.currentBlockIndex).toNumber();
  }

  return hashOrIndex;
};

function getIndex<T>(context: ExecutionContext, index: number, values: readonly T[]): T {
  if (index < 0 || index >= values.length) {
    throw new InvalidIndexError(context);
  }

  return values[index];
}

const checkWitness = async ({ context, hash }: { readonly context: ExecutionContext; readonly hash: UInt160 }) => {
  const { scriptContainer, skipWitnessVerify } = context.init;
  if (skipWitnessVerify) {
    return true;
  }

  let scriptHashesForVerifying;
  switch (scriptContainer.type) {
    case ScriptContainerType.Transaction:
      scriptHashesForVerifying = await scriptContainer.value.getScriptHashesForVerifying({
        getOutput: context.blockchain.output.get,
        getAsset: context.blockchain.asset.get,
      });

      break;
    case ScriptContainerType.Block:
      scriptHashesForVerifying = await scriptContainer.value.getScriptHashesForVerifying({
        getHeader: context.blockchain.header.get,
      });

      break;
    case ScriptContainerType.Consensus:
      scriptHashesForVerifying = await scriptContainer.value.getScriptHashesForVerifying({
        getValidators: async () => context.blockchain.getValidators([]),
        currentBlockHash: context.blockchain.currentBlock.hash,
      });

      break;
    default:
      commonUtils.assertNever(scriptContainer);
      throw new Error('For TS');
  }

  return scriptHashesForVerifying.has(common.uInt160ToHex(hash));
};

const checkWitnessPublicKey = async ({
  context,
  publicKey,
}: {
  readonly context: ExecutionContext;
  readonly publicKey: ECPoint;
}) =>
  checkWitness({
    context,
    hash: crypto.getVerificationScriptHash(publicKey),
  });

const checkWitnessBuffer = async ({
  context,
  hashOrPublicKey,
}: {
  readonly context: ExecutionContext;
  readonly hashOrPublicKey: Buffer;
}) => {
  if (hashOrPublicKey.length === common.ECPOINT_BUFFER_BYTES) {
    return checkWitnessPublicKey({
      context,
      publicKey: common.bufferToECPoint(hashOrPublicKey),
    });
  }

  return checkWitness({
    context,
    hash: common.bufferToUInt160(hashOrPublicKey),
  });
};

const createContract = async ({
  context,
  args,
}: {
  readonly context: ExecutionContext;
  readonly args: readonly StackItem[];
}) => {
  const script = args[0].asBuffer();
  // Removed check of valid ContractParameterTypes to match neo
  const parameterList = [...args[1].asBuffer()].filter(isContractParameterType);

  const returnType = assertContractParameterType(args[2].asBigIntegerUnsafe().toNumber());

  const contractProperties = assertContractPropertyState(args[3].asBigIntegerUnsafe().toNumber());

  const name = args[4].asString();
  const codeVersion = args[5].asString();
  const author = args[6].asString();
  const email = args[7].asString();
  const description = args[8].asString();
  const hash = crypto.hash160(script);
  let contract = await context.blockchain.contract.tryGet({ hash });
  let created = false;
  if (contract === undefined) {
    contract = new Contract({
      script,
      parameterList,

      returnType,
      contractProperties,
      name,
      codeVersion,
      author,
      email,
      description,
      hash,
    });

    await context.blockchain.contract.add(contract);
    created = true;
  }

  return { contract, created };
};

const checkStorage = async ({ context, hash }: { readonly context: ExecutionContext; readonly hash: UInt160 }) => {
  const contract = await context.blockchain.contract.get({ hash });
  if (!contract.hasStorage) {
    throw new ContractNoStorageError(context, common.uInt160ToString(hash));
  }

  return contract;
};

function getContractFee<T>(func: (args: CreateSysCallArgs, fee: BN) => T): (args: CreateSysCallArgs) => T {
  return (args) => {
    const { context: contextIn } = args;
    const contractProperties = assertContractPropertyState(contextIn.stack[3].asBigIntegerUnsafe().toNumber());

    let fee = common.ONE_HUNDRED_FIXED8;

    if (HasStorage.has(contractProperties)) {
      fee = fee.add(common.FOUR_HUNDRED_FIXED8);
    }
    if (HasDynamicInvoke.has(contractProperties)) {
      fee = fee.add(common.FIVE_HUNDRED_FIXED8);
    }

    return func(args, fee);
  };
}

const destroyContract = async ({ context }: OpInvokeArgs) => {
  const hash = context.scriptHash;
  const contract = await context.blockchain.contract.tryGet({ hash });
  if (contract !== undefined) {
    await Promise.all([
      context.blockchain.contract.delete({ hash }),
      contract.hasStorage
        ? context.blockchain.storageItem
            .getAll$({ hash })
            .pipe(
              concatMap((item) =>
                defer(async () =>
                  context.blockchain.storageItem.delete({
                    hash,
                    key: item.key,
                  }),
                ),
              ),
            )
            .toPromise()
        : Promise.resolve(),
    ]);
  }
};

const createPut = ({ name }: { readonly name: 'System.Storage.Put' | 'System.Storage.PutEx' }) => ({
  context: contextIn,
}: CreateSysCallArgs) => {
  const keyIn = contextIn.stack[1] as StackItem | undefined;
  const valueIn = contextIn.stack[2] as StackItem | undefined;
  const expectedIn = name === 'System.Storage.Put' ? 3 : 4;
  if (keyIn === undefined || valueIn === undefined) {
    throw new StackUnderflowError(contextIn, 'SYSCALL', contextIn.stack.length, expectedIn);
  }
  const numBytes = new BN(keyIn.asBuffer().length).add(new BN(valueIn.asBuffer().length));

  return createSysCall({
    name,
    in: expectedIn,
    fee: FEES[100_000].mul(numBytes),
    invoke: async ({ context, args }) => {
      if (context.init.triggerType !== TriggerType.Application) {
        throw new InvalidVerifySyscallError(context, name);
      }
      const hash = vmUtils.toStorageContext({
        context,
        value: args[0],
        write: true,
      }).value;
      await checkStorage({ context, hash });
      const key = args[1].asBuffer();
      if (key.length > 1024) {
        throw new ItemTooLargeError(context);
      }

      const value = args[2].asBuffer();
      const flags =
        name === 'System.Storage.Put' ? StorageFlags.None : assertStorageFlags(args[3].asBigIntegerUnsafe().toNumber());
      const item = await context.blockchain.storageItem.tryGet({ hash, key });
      if (item !== undefined) {
        if (hasStorageFlag(item.flags, StorageFlags.Constant)) {
          throw new ConstantStorageError(context, key);
        }
        await context.blockchain.storageItem.update(item, { value, flags });
      } else {
        await context.blockchain.storageItem.add(new StorageItem({ hash, key, value, flags }));
      }

      return { context };
    },
  })({ context: contextIn });
};

export const SYSCALLS: { readonly [K in SysCallEnum]: CreateSysCall } = {
  'System.Runtime.Platform': createSysCall({
    name: 'System.Runtime.Platform',
    out: 1,
    fee: FEES[250],
    invoke: ({ context }) => ({
      context,
      results: [new BufferStackItem(Buffer.from('NEO', 'ascii'))],
    }),
  }),
  'System.Runtime.GetTrigger': createSysCall({
    name: 'System.Runtime.GetTrigger',
    out: 1,
    fee: FEES[250],
    invoke: ({ context }) => ({
      context,
      results: [new IntegerStackItem(new BN(context.init.triggerType))],
    }),
  }),

  'System.Runtime.CheckWitness': createSysCall({
    name: 'System.Runtime.CheckWitness',
    in: 1,
    out: 1,
    fee: FEES[30_000],
    invoke: async ({ context, args }) => ({
      context,
      results: [
        new BooleanStackItem(
          await checkWitnessBuffer({
            context,
            hashOrPublicKey: args[0].asBuffer(),
          }),
        ),
      ],
    }),
  }),

  'System.Runtime.Notify': createSysCall({
    name: 'System.Runtime.Notify',
    in: 1,
    fee: FEES[250],
    invoke: async ({ context, args }) => {
      const { onNotify } = context.init.listeners;
      if (onNotify !== undefined) {
        onNotify({
          scriptHash: context.scriptHash,
          args: args[0].isArray()
            ? args[0].asArray().map((item) => item.toContractParameter())
            : [args[0].toContractParameter()],
        });
      }

      return { context };
    },
  }),

  'System.Runtime.Log': createSysCall({
    name: 'System.Runtime.Log',
    in: 1,
    fee: FEES[300_000],
    invoke: async ({ context, args }) => {
      const { onLog } = context.init.listeners;
      if (onLog !== undefined) {
        onLog({
          scriptHash: context.scriptHash,
          message: args[0].asString(),
        });
      }

      return { context };
    },
  }),

  'System.Runtime.GetTime': createSysCall({
    name: 'System.Runtime.GetTime',
    out: 1,
    fee: FEES[250],
    invoke: async ({ context }) => {
      const { persistingBlock } = context.init;
      const time =
        persistingBlock === undefined
          ? context.blockchain.currentBlock.timestamp + context.blockchain.settings.secondsPerBlock
          : persistingBlock.timestamp;

      return {
        context,
        results: [new IntegerStackItem(new BN(time))],
      };
    },
  }),

  'System.Runtime.Serialize': createSysCall({
    name: 'System.Runtime.Serialize',
    in: 1,
    out: 1,
    fee: FEES[100_000],
    invoke: async ({ context, args }) => {
      const serialized = args[0].serialize();

      if (serialized.length > MAX_ITEM_SIZE) {
        throw new ItemTooLargeError(context);
      }

      return { context, results: [new BufferStackItem(serialized)] };
    },
  }),

  'System.Runtime.Deserialize': createSysCall({
    name: 'System.Runtime.Deserialize',
    in: 1,
    out: 1,
    fee: FEES[500_000],
    invoke: async ({ context, args }) => {
      const deserialized = deserializeStackItem(args[0].asBuffer());

      return { context, results: [deserialized] };
    },
  }),

  'System.Runtime.GetInvocationCounter': createSysCall({
    name: 'System.Runtime.GetInvocationCounter',
    out: 1,
    fee: FEES[400],
    invoke: async ({ context }) => {
      const scriptHashString = common.uInt160ToString(context.scriptHash);
      const invocationCount = context.invocationCounter[scriptHashString];
      if (invocationCount === undefined) {
        throw new InvalidInvocationCounterError(context, scriptHashString);
      }

      return { context, results: [new IntegerStackItem(new BN(invocationCount))] };
    },
  }),

  'System.Runtime.GetNotifications': createSysCall({
    name: 'System.Runtime.GetNotifications',
    in: 1,
    out: 1,
    fee: FEES[10_000],
    invoke: async ({ context, args }) => {
      // need to track notifications

      return { context, results: [] };
    },
  }),

  'Neo.Json.Serialize': createSysCall({
    name: 'Neo.Json.Serialize',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => {
      // need json serializable

      return { context, results: [] };
    },
  }),

  'Neo.Json.Deserialize': createSysCall({
    name: 'Neo.Json.Deserialize',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => {
      // need json serializable

      return { context, results: [] };
    },
  }),

  // double check this one
  'System.Crypto.Verify': createSysCall({
    name: 'System.Crypto.Verify',
    in: 3,
    out: 1,
    fee: FEES[1_000_000],
    invoke: async ({ context, args }) => {
      const message = args[0].asBuffer();
      const publicKey = args[1].asECPoint();
      const signature = args[2].asBuffer();
      let result;
      try {
        result = await crypto.verify({
          message,
          signature,
          publicKey,
        });
      } catch {
        result = false;
      }

      return {
        context,
        results: [new BooleanStackItem(result)],
      };
    },
  }),

  'Neo.Crypto.CheckSig': createSysCall({
    name: 'Neo.Crypto.CheckSig',
    in: 2,
    out: 1,
    fee: FEES[1_000_000],
    invoke: async ({ context, args }) => {
      const publicKey = args[0].asECPoint();
      const signature = args[1].asBuffer();
      let result;
      try {
        result = await crypto.verify({
          message: context.init.scriptContainer.value.message,
          signature,
          publicKey,
        });
      } catch {
        result = false;
      }

      return {
        context,
        results: [new BooleanStackItem(result)],
      };
    },
  }),

  'Neo.Crypto.CheckMultiSig': ({ context: contextIn }) => {
    const { stack } = contextIn;
    const top = stack[0] as StackItem | undefined;
    let pubKeyCount = 0;
    let _in;
    if (top === undefined || top.isArray()) {
      if (top !== undefined) {
        pubKeyCount = top.asArray().length;
      }
      _in = 1;
    } else {
      pubKeyCount = vmUtils.toNumber(contextIn, top.asBigIntegerUnsafe());
      if (pubKeyCount <= 0) {
        throw new InvalidCheckMultisigArgumentsError(contextIn);
      }
      _in = pubKeyCount + 1;
    }

    const next = stack[_in] as StackItem | undefined;
    if (next === undefined || next.isArray()) {
      _in += 1;
    } else {
      const sigCount = vmUtils.toNumber(contextIn, next.asBigIntegerUnsafe());
      if (sigCount < 0) {
        throw new InvalidCheckMultisigArgumentsError(contextIn);
      }
      _in += sigCount + 1;
    }

    return createSysCall({
      name: 'Neo.Crypto.CheckMultiSig',
      in: _in,
      out: 1,
      fee: pubKeyCount === 0 ? utils.ZERO : FEES[1_000_000].mul(new BN(pubKeyCount)),
      invoke: async ({ context, args }) => {
        let index;
        let publicKeys;
        if (args[0].isArray()) {
          index = 1;
          publicKeys = args[0].asArray().map((value) => value.asECPoint());
        } else {
          const count = vmUtils.toNumber(context, args[0].asBigIntegerUnsafe());
          index = count + 1;
          publicKeys = args.slice(1, index).map((value) => value.asECPoint());
        }

        const signatures = args[index].isArray()
          ? args[index].asArray().map((value) => value.asBuffer())
          : args.slice(index + 1).map((value) => value.asBuffer());

        if (publicKeys.length === 0 || signatures.length === 0 || signatures.length > publicKeys.length) {
          throw new InvalidCheckMultisigArgumentsError(context);
        }

        let result = true;
        const n = publicKeys.length;
        const m = signatures.length;
        try {
          // tslint:disable-next-line no-loop-statement
          for (let i = 0, j = 0; result && i < m && j < n; ) {
            const currentResult = crypto.verify({
              message: context.init.scriptContainer.value.message,
              signature: signatures[i],
              publicKey: publicKeys[j],
            });

            if (currentResult) {
              i += 1;
            }
            j += 1;
            if (m - i > n - j) {
              result = false;
            }
          }
        } catch {
          result = false;
        }

        return {
          context,
          results: [new BooleanStackItem(result)],
        };
      },
    })({ context: contextIn });
  },

  'System.Blockchain.GetHeight': createSysCall({
    name: 'System.Blockchain.GetHeight',
    out: 1,
    fee: FEES[400],
    invoke: ({ context }) => ({
      context,
      results: [new IntegerStackItem(new BN(context.blockchain.currentBlock.index))],
    }),
  }),

  'System.Blockchain.GetHeader': createSysCall({
    name: 'System.Blockchain.GetHeader',
    in: 1,
    out: 1,
    fee: FEES[7_000],
    invoke: async ({ context, args }) => {
      const hashOrIndex = getHashOrIndex({ context, arg: args[0] });
      if (hashOrIndex === undefined) {
        throw new InvalidGetHeaderArgumentsError(context);
      }
      const header = await context.blockchain.header.get({ hashOrIndex });

      return {
        context,
        results: [new HeaderStackItem(header)],
      };
    },
  }),

  'System.Blockchain.GetBlock': createSysCall({
    name: 'System.Blockchain.GetBlock',
    in: 1,
    out: 1,
    fee: FEES[2_500_000],
    invoke: async ({ context, args }) => {
      const hashOrIndex = getHashOrIndex({
        context,
        arg: args[0],
      });

      if (hashOrIndex === undefined) {
        throw new InvalidGetBlockArgumentsError(context, args[0].asBufferMaybe());
      }
      const block = await context.blockchain.block.get({ hashOrIndex });

      return {
        context,
        results: [new BlockStackItem(block)],
      };
    },
  }),

  'System.Blockchain.GetTransaction': createSysCall({
    name: 'System.Blockchain.GetTransaction',
    in: 1,
    out: 1,
    fee: FEES[1_000_000],
    invoke: async ({ context, args }) => {
      const transaction = await context.blockchain.transaction.get({
        hash: args[0].asUInt256(),
      });

      return {
        context,
        results: [new TransactionStackItem(transaction)],
      };
    },
  }),

  'System.Blockchain.GetTransactionHeight': createSysCall({
    name: 'System.Blockchain.GetTransactionHeight',
    in: 1,
    out: 1,
    fee: FEES[1_000_000],
    invoke: async ({ context, args }) => {
      const transactionData = await context.blockchain.transactionData.get({
        hash: args[0].asUInt256(),
      });

      return {
        context,
        results: [new IntegerStackItem(new BN(transactionData.startHeight))],
      };
    },
  }),

  'System.Blockchain.GetContract': createSysCall({
    name: 'System.Blockchain.GetContract',
    in: 1,
    out: 1,
    fee: FEES[1_000_000],
    invoke: async ({ context, args }) => {
      const contract = await context.blockchain.contract.tryGet({
        hash: args[0].asUInt160(),
      });

      return {
        context,
        results: [contract === undefined ? new BufferStackItem(Buffer.alloc(0, 0)) : new ContractStackItem(contract)],
      };
    },
  }),

  'System.Header.GetHash': createSysCall({
    name: 'System.Header.GetHash',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: ({ context, args }) => ({
      context,
      results: [new UInt256StackItem(args[0].asBlockBase().hash)],
    }),
  }),

  'Neo.Header.GetVersion': createSysCall({
    name: 'Neo.Header.GetVersion',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: ({ context, args }) => ({
      context,
      results: [new IntegerStackItem(new BN(args[0].asBlockBase().version))],
    }),
  }),

  'System.Header.GetPrevHash': createSysCall({
    name: 'System.Header.GetPrevHash',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: ({ context, args }) => ({
      context,
      results: [new UInt256StackItem(args[0].asBlockBase().previousHash)],
    }),
  }),

  'System.Header.GetIndex': createSysCall({
    name: 'System.Header.GetIndex',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: ({ context, args }) => ({
      context,
      results: [new IntegerStackItem(new BN(args[0].asBlockBase().index))],
    }),
  }),

  'Neo.Header.GetMerkleRoot': createSysCall({
    name: 'Neo.Header.GetMerkleRoot',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: ({ context, args }) => ({
      context,
      results: [new UInt256StackItem(args[0].asBlockBase().merkleRoot)],
    }),
  }),

  'System.Header.GetTimestamp': createSysCall({
    name: 'System.Header.GetTimestamp',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: ({ context, args }) => ({
      context,
      results: [new IntegerStackItem(new BN(args[0].asBlockBase().timestamp))],
    }),
  }),

  'Neo.Header.GetNextConsensus': createSysCall({
    name: 'Neo.Header.GetNextConsensus',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: ({ context, args }) => ({
      context,
      results: [new UInt160StackItem(args[0].asBlockBase().nextConsensus)],
    }),
  }),

  'System.Block.GetTransactionCount': createSysCall({
    name: 'System.Block.GetTransactionCount',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: ({ context, args }) => ({
      context,
      results: [new IntegerStackItem(new BN(args[0].asBlock().transactions.length))],
    }),
  }),

  'System.Block.GetTransactions': createSysCall({
    name: 'System.Block.GetTransactions',
    in: 1,
    out: 1,
    fee: FEES[10_000],
    invoke: ({ context, args }) => {
      if (args[0].asBlock().transactions.length > MAX_ARRAY_SIZE) {
        throw new ContainerTooLargeError(context);
      }

      return {
        context,
        results: [
          new ArrayStackItem(
            args[0].asBlock().transactions.map((transaction) => new TransactionStackItem(transaction)),
          ),
        ],
      };
    },
  }),

  'System.Block.GetTransaction': createSysCall({
    name: 'System.Block.GetTransaction',
    in: 2,
    out: 1,
    fee: FEES[400],
    invoke: ({ context, args }) => ({
      context,
      results: [
        new TransactionStackItem(
          getIndex(context, args[1].asBigIntegerUnsafe().toNumber(), args[0].asBlock().transactions),
        ),
      ],
    }),
  }),

  'System.Transaction.GetHash': createSysCall({
    name: 'System.Transaction.GetHash',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: ({ context, args }) => ({
      context,
      results: [new UInt256StackItem(args[0].asTransaction().hash)],
    }),
  }),

  'Neo.Transaction.GetWitnesses': createSysCall({
    name: 'Neo.Transaction.GetWitnesses',
    in: 1,
    out: 1,
    fee: FEES[10_000],
    invoke: async ({ context, args }) => {
      const transaction = args[0].asTransaction();

      if (transaction.scripts.length > MAX_ARRAY_SIZE) {
        throw new ContainerTooLargeError(context);
      }

      const hashes = await transaction.getSortedScriptHashesForVerifying({
        getOutput: context.blockchain.output.get,
        getAsset: context.blockchain.asset.get,
      });
      const witnesses = await Promise.all(
        transaction.scripts.map(async (witness, idx) => {
          if (witness.verification.length === 0) {
            const contract = await context.blockchain.contract.get({ hash: common.stringToUInt160(hashes[idx]) });

            return new Witness({
              invocation: witness.invocation,
              verification: contract.script,
            });
          }

          return witness;
        }),
      );

      return {
        context,
        results: [new ArrayStackItem(witnesses.map((witness) => new WitnessStackItem(witness)))],
      };
    },
  }),

  'Neo.Witness.GetVerificationScript': createSysCall({
    name: 'Neo.Witness.GetVerificationScript',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => {
      const witness = args[0].asWitness();

      return {
        context,
        results: [new BufferStackItem(witness.verification)],
      };
    },
  }),

  'Neo.Transaction.GetScript': createSysCall({
    name: 'Neo.Transaction.GetScript',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => {
      const transaction = args[0].asTransaction();
      if (transaction instanceof InvocationTransaction) {
        return {
          context,
          results: [new BufferStackItem(transaction.script)],
        };
      }

      throw new InvalidInvocationTransactionError(context);
    },
  }),

  'Neo.Contract.GetScript': createSysCall({
    name: 'Neo.Contract.GetScript',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: ({ context, args }) => ({
      context,
      results: [new BufferStackItem(args[0].asContract().script)],
    }),
  }),

  'Neo.Contract.IsPayable': createSysCall({
    name: 'Neo.Contract.IsPayable',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: ({ context, args }) => ({
      context,
      results: [new BooleanStackItem(args[0].asContract().payable)],
    }),
  }),

  'System.Storage.GetContext': createSysCall({
    name: 'System.Storage.GetContext',
    out: 1,
    fee: FEES[400],
    invoke: ({ context }) => ({
      context,
      results: [new StorageContextStackItem(context.scriptHash)],
    }),
  }),

  'System.Storage.GetReadOnlyContext': createSysCall({
    name: 'System.Storage.GetReadOnlyContext',
    out: 1,
    fee: FEES[400],
    invoke: ({ context }) => ({
      context,
      results: [new StorageContextStackItem(context.scriptHash).asReadOnly()],
    }),
  }),

  'System.Storage.Get': createSysCall({
    name: 'System.Storage.Get',
    in: 2,
    out: 1,
    fee: FEES[1_000_000],
    invoke: async ({ context, args }) => {
      const hash = vmUtils.toStorageContext({ context, value: args[0] }).value;
      await checkStorage({ context, hash });

      const item = await context.blockchain.storageItem.tryGet({
        hash,
        key: args[1].asBuffer(),
      });

      const result = item === undefined ? Buffer.from([]) : item.value;

      return {
        context,
        results: [new BufferStackItem(result)],
      };
    },
  }),

  'Neo.Storage.Find': createSysCall({
    name: 'Neo.Storage.Find',
    in: 2,
    out: 1,
    fee: FEES[1_000_000],
    invoke: async ({ context, args }) => {
      const hash = vmUtils.toStorageContext({ context, value: args[0] }).value;
      await checkStorage({ context, hash });

      const prefix = args[1].asBuffer();
      const iterable = AsyncIterableX.from<StorageItem>(context.blockchain.storageItem.getAll$({ hash, prefix })).pipe<{
        key: BufferStackItem;
        value: BufferStackItem;
      }>(
        asyncMap(({ key, value }) => ({
          key: new BufferStackItem(key),
          value: new BufferStackItem(value),
        })),
      );

      return {
        context,
        results: [new IteratorStackItem(new StackItemIterator(iterable[Symbol.asyncIterator]()))],
      };
    },
  }),

  'System.StorageContext.AsReadOnly': createSysCall({
    name: 'System.StorageContext.AsReadOnly',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: ({ context, args }) => ({
      context,
      results: [vmUtils.toStorageContext({ context, value: args[0] }).asReadOnly()],
    }),
  }),

  'Neo.Native.Deploy': createSysCall({
    name: 'Neo.Native.Deploy',
    out: 1,
    fee: FEES[400],
    invoke: async ({ context }) => {
      if (context.init.persistingBlock === undefined) {
        throw new InvalidNativeDeployError(context, undefined);
      }
      if (context.init.persistingBlock.index !== 0) {
        throw new InvalidNativeDeployError(context, context.init.persistingBlock.index);
      }

      // Actually Deploy Native Contracts

      return { context };
    },
  }),

  'Neo.Enumerator.Create': createSysCall({
    name: 'Neo.Enumerator.Create',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => {
      const iterable = AsyncIterableX.from(args[0].asArray().map((value) => ({ value })));

      return {
        context,
        results: [new EnumeratorStackItem(new StackItemEnumerator(iterable[Symbol.asyncIterator]()))],
      };
    },
  }),

  'Neo.Enumerator.Next': createSysCall({
    name: 'Neo.Enumerator.Next',
    in: 1,
    out: 1,
    fee: FEES[1_000_000],
    invoke: async ({ context, args }) => {
      const enumerator = args[0].asEnumerator();
      const value = await enumerator.next();

      return {
        context,
        results: [new BooleanStackItem(value)],
      };
    },
  }),

  'Neo.Iterator.Create': createSysCall({
    name: 'Neo.Iterator.Create',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => {
      const iterable = args[0].isArray()
        ? AsyncIterableX.from(
            args[0].asArray().map((value, idx) => ({
              key: new IntegerStackItem(new BN(idx)),
              value,
            })),
          )
        : AsyncIterableX.from(
            commonUtils
              .zip(args[0].asMapStackItem().keysArray(), args[0].asMapStackItem().valuesArray())
              .map(([key, value]) => ({ key, value })),
          );

      return {
        context,
        results: [new IteratorStackItem(new StackItemIterator(iterable[Symbol.asyncIterator]()))],
      };
    },
  }),

  'Neo.Iterator.Key': createSysCall({
    name: 'Neo.Iterator.Key',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => ({
      context,
      // tslint:disable-next-line no-any
      results: [args[0].asIterator().key() as any],
    }),
  }),

  'Neo.Enumerator.Value': createSysCall({
    name: 'Neo.Enumerator.Value',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => ({
      context,
      // tslint:disable-next-line no-any
      results: [args[0].asEnumerator().value() as any],
    }),
  }),

  'Neo.Enumerator.Concat': createSysCall({
    name: 'Neo.Enumerator.Concat',
    in: 2,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => ({
      context,
      results: [new EnumeratorStackItem(args[0].asEnumerator().concat(args[1].asEnumerator()))],
    }),
  }),

  'Neo.Iterator.Concat': createSysCall({
    name: 'Neo.Iterator.Concat',
    in: 2,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => ({
      context,
      results: [new IteratorStackItem(args[0].asIterator().concatIterator(args[1].asIterator()))],
    }),
  }),

  'Neo.Iterator.Keys': createSysCall({
    name: 'Neo.Iterator.Keys',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => ({
      context,
      results: [new EnumeratorStackItem(args[0].asIterator().keys())],
    }),
  }),

  'Neo.Iterator.Values': createSysCall({
    name: 'Neo.Iterator.Values',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => ({
      context,
      results: [new EnumeratorStackItem(args[0].asIterator().values())],
    }),
  }),

  'Neo.Account.IsStandard': createSysCall({
    name: 'Neo.Account.IsStandard',
    in: 1,
    out: 1,
    fee: FEES[30_000],
    invoke: async ({ context, args }) => {
      const hash = args[0].asUInt160();
      const contract = await context.blockchain.contract.tryGet({ hash });

      return {
        context,
        results: [new BooleanStackItem(contract === undefined || crypto.isStandardContract(contract.script))],
      };
    },
  }),

  'Neo.Contract.Create': getContractFee((argsIn, fee) =>
    createSysCall({
      name: 'Neo.Contract.Create',
      in: 9,
      out: 1,
      fee,
      invoke: async ({ context, args }) => {
        if (context.init.triggerType !== TriggerType.Application) {
          throw new InvalidVerifySyscallError(context, 'Neo.Contract.Create');
        }
        const { contract } = await createContract({ context, args });
        const result = new ContractStackItem(contract);

        return {
          context: {
            ...context,
            createdContracts: {
              ...context.createdContracts,
              [contract.hashHex]: context.scriptHash,
            },
          },

          results: [result],
        };
      },
    })(argsIn),
  ),

  'Neo.Contract.Update': getContractFee((argsIn, fee) =>
    createSysCall({
      name: 'Neo.Contract.Update',
      in: 9,
      out: 1,
      fee,
      invoke: async (options) => {
        if (options.context.init.triggerType !== TriggerType.Application) {
          throw new InvalidVerifySyscallError(options.context, 'Neo.Contract.Update');
        }
        const { context: contextIn, args } = options;
        let context = contextIn;
        const { contract, created } = await createContract({ context, args });
        if (contract.hasStorage && created) {
          await context.blockchain.storageItem
            .getAll$({
              hash: context.scriptHash,
            })
            .pipe(
              concatMap((item) =>
                defer(async () =>
                  context.blockchain.storageItem.add(
                    new StorageItem({
                      hash: contract.hash,
                      key: item.key,
                      value: item.value,
                      flags: StorageFlags.None,
                    }),
                  ),
                ),
              ),
            )
            .toPromise();
          context = {
            ...context,
            createdContracts: {
              ...context.createdContracts,
              [contract.hashHex]: context.scriptHash,
            },
          };
        }

        await destroyContract(options);

        if (context.init.listeners.onMigrateContract !== undefined) {
          context.init.listeners.onMigrateContract({
            from: context.scriptHash,
            to: contract.hash,
          });
        }

        return {
          context,
          results: [new ContractStackItem(contract)],
        };
      },
    })(argsIn),
  ),

  'System.Contract.Destroy': createSysCall({
    name: 'System.Contract.Destroy',
    fee: FEES[1_000_000],
    invoke: async (options) => {
      if (options.context.init.triggerType !== TriggerType.Application) {
        throw new InvalidVerifySyscallError(options.context, 'System.Contract.Destroy');
      }
      await destroyContract(options);

      return { context: options.context };
    },
  }),

  'System.Contract.Call': createSysCall({
    name: 'System.Contract.Call',
    in: 1,
    out: 1,
    fee: FEES[1_000_000],
    invoke: async ({ context, args }) => {
      // need to update: invocation counter, ability to take contract as arg

      return { context, results: [] };
    },
  }),

  'System.Storage.Put': createPut({ name: 'System.Storage.Put' }),

  'System.Storage.PutEx': createPut({ name: 'System.Storage.PutEx' }),

  'System.Storage.Delete': createSysCall({
    name: 'System.Storage.Delete',
    in: 2,
    fee: FEES[1_000_000],
    invoke: async ({ context, args }) => {
      const hash = vmUtils.toStorageContext({
        context,
        value: args[0],
        write: true,
      }).value;
      await checkStorage({ context, hash });
      const key = args[1].asBuffer();
      const existing = await context.blockchain.storageItem.tryGet({ hash, key });
      if (existing !== undefined) {
        if (hasStorageFlag(existing.flags, StorageFlags.Constant)) {
          throw new ConstantStorageError(context, key);
        }

        await context.blockchain.storageItem.delete({ hash, key });
      }

      return { context };
    },
  }),

  'System.ExecutionEngine.GetScriptContainer': createSysCall({
    name: 'System.ExecutionEngine.GetScriptContainer',
    out: 1,
    fee: FEES[250],
    invoke: async ({ context }) => {
      let result;
      const { scriptContainer } = context.init;
      switch (scriptContainer.type) {
        case ScriptContainerType.Transaction:
          result = new TransactionStackItem(scriptContainer.value);
          break;
        case ScriptContainerType.Block:
          result = new BlockStackItem(scriptContainer.value);
          break;
        case ScriptContainerType.Consensus:
          result = new ConsensusPayloadStackItem(scriptContainer.value);
          break;
        /* istanbul ignore next */
        default:
          commonUtils.assertNever(scriptContainer);
          throw new Error('For TS');
      }

      return { context, results: [result] };
    },
  }),

  'System.ExecutionEngine.GetExecutingScriptHash': createSysCall({
    name: 'System.ExecutionEngine.GetExecutingScriptHash',
    out: 1,
    fee: FEES[400],
    invoke: async ({ context }) => ({
      context,
      results: [new UInt160StackItem(context.scriptHash)],
    }),
  }),

  'System.ExecutionEngine.GetCallingScriptHash': createSysCall({
    name: 'System.ExecutionEngine.GetCallingScriptHash',
    out: 1,
    fee: FEES[400],
    invoke: async ({ context }) => ({
      context,
      results: [
        context.scriptHashStack.length > 1
          ? new UInt160StackItem(context.scriptHashStack[1])
          : new BufferStackItem(Buffer.alloc(0, 0)),
      ],
    }),
  }),

  'System.ExecutionEngine.GetEntryScriptHash': createSysCall({
    name: 'System.ExecutionEngine.GetEntryScriptHash',
    out: 1,
    fee: FEES[400],
    invoke: async ({ context }) => ({
      context,
      results: [new UInt160StackItem(context.scriptHashStack[context.scriptHashStack.length - 1])],
    }),
  }),
};

export const SYSCALL_ALIASES: { readonly [key: string]: string | undefined } = {
  'Neo.Iterator.Next': 'Neo.Enumerator.Next',
  'Neo.Iterator.Value': 'Neo.Enumerator.Value',
};

const SYS_CALL_STRING_LENGTH = 252;

const SYSCALLS_BY_HASH = _.fromPairs(
  Object.entries(SYSCALLS).map(([key, value]) => [toSysCallHash(key as SysCallEnum), value]),
);

export const lookupSysCall = ({ context }: { readonly context: ExecutionContext }) => {
  const { code, pc } = context;
  const reader = new BinaryReader(code, pc);

  const sysCallBytes = reader.readVarBytesLE(SYS_CALL_STRING_LENGTH);
  let key: SysCallHash;
  let debugName: string;
  if (sysCallBytes.length === 4) {
    key = sysCallBytes.readUInt32LE(0) as SysCallHash;
    debugName = sysCallBytes.toString('hex');
  } else {
    const sysCallName = utils.toASCII(sysCallBytes);
    const aliasName = SYSCALL_ALIASES[sysCallName];
    const canonicalName = aliasName === undefined ? sysCallName : aliasName;
    key = toSysCallHash(assertSysCall(canonicalName));
    debugName = canonicalName;
  }
  const createCall = SYSCALLS_BY_HASH[key];
  // tslint:disable-next-line: strict-type-predicates
  if (createCall === undefined) {
    throw new UnknownSysCallError(context, debugName);
  }

  const nextContext = {
    ...context,
    pc: reader.index,
  };

  return createCall({ context: nextContext });
};
