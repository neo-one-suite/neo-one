/// <reference types="@reactivex/ix-es2015-cjs" />
import {
  assertStorageFlags,
  assertSysCall,
  common,
  crypto,
  ECPoint,
  hasStorageFlag,
  SysCall as SysCallEnum,
  SysCallHash,
  SysCallName,
  toSysCallHash,
  UInt160,
  UInt256,
  VMState,
} from '@neo-one/client-common';
import { ContractManifestModel, ContractPermissionsModel } from '@neo-one/client-full-common';
import {
  BinaryReader,
  Contract,
  ContractABI,
  ContractManifest,
  ScriptContainerType,
  StorageFlags,
  StorageItem,
  TriggerType,
  utils,
} from '@neo-one/node-core';
import { utils as commonUtils } from '@neo-one/utils';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { map as asyncMap } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/map';
import { BN } from 'bn.js';
import _ from 'lodash';
import { defer } from 'rxjs';
import { concatMap, toArray } from 'rxjs/operators';
import {
  ExecutionContext,
  FEES,
  GAS_PER_BYTE,
  MAX_ITEM_SIZE,
  MAX_MANIFEST_LENGTH,
  OpInvoke,
  OpInvokeArgs,
  SysCall,
} from './constants';
import {
  ConstantStorageError,
  ContractAlreadyDeployedError,
  ContractHashNotFoundError,
  ContractMethodUndefinedError,
  ContractNoStorageError,
  InvalidCheckMultisigArgumentsError,
  InvalidContractManifestError,
  InvalidGetBlockArgumentsError,
  InvalidInvocationCounterError,
  InvalidJsonError,
  InvalidNativeDeployError,
  InvalidPermissionError,
  InvalidTransactionIndexError,
  InvalidVerifySyscallError,
  ItemTooLargeError,
  StackUnderflowError,
  UnknownNativeContractError,
  UnknownSysCallError,
} from './errors';
import { NativeContract, NativeContractServiceName } from './native';
import {
  ArrayStackItem,
  BlockStackItem,
  BooleanStackItem,
  BufferStackItem,
  ConsensusPayloadStackItem,
  ContractStackItem,
  deserializeJson,
  deserializeStackItem,
  EnumeratorStackItem,
  IntegerStackItem,
  IteratorStackItem,
  NullStackItem,
  serializeJson,
  StackItem,
  StackItemEnumerator,
  StackItemIterator,
  StorageContextStackItem,
  TransactionStackItem,
  UInt160StackItem,
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

export const checkWitness = async ({
  context,
  hash,
}: {
  readonly context: ExecutionContext;
  readonly hash: UInt160;
}) => {
  const { scriptContainer, skipWitnessVerify } = context.init;
  if (skipWitnessVerify) {
    return true;
  }

  let scriptHashesForVerifying;
  switch (scriptContainer.type) {
    case ScriptContainerType.Transaction:
      scriptHashesForVerifying = scriptContainer.value.getScriptHashesForVerifying();

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

const canCall = ({
  callingContract,
  contractToCall,
  method,
}: {
  readonly callingContract: Contract;
  readonly contractToCall: Contract;
  readonly method: string;
}): boolean => {
  const isAllowed = (
    contractPermission: ContractPermissionsModel,
    manifest: ContractManifestModel,
    methodIn: string,
  ) => {
    const callingPermission = contractPermission.contract;
    if (callingPermission.isWildcard()) {
      return true;
    }
    if (callingPermission.isHash() && !common.uInt160Equal(callingPermission.hashOrGroup as UInt160, manifest.hash)) {
      return false;
    }
    if (
      callingPermission.isGroup() &&
      manifest.groups.every((group) => !common.ecPointEqual(callingPermission.hashOrGroup as ECPoint, group.publicKey))
    ) {
      return false;
    }

    return contractPermission.methods.includes(methodIn);
  };

  return callingContract.manifest.permissions.some((permission) =>
    isAllowed(permission, contractToCall.manifest, method),
  );
};

const manifestIsValid = ({
  manifest,
  hash,
}: {
  readonly manifest: ContractManifest;
  readonly hash: UInt160;
}): boolean => {
  if (!manifest.abi.hash.equals(hash)) {
    return false;
  }
  const message = common.uInt160ToBuffer(hash);
  if (
    !manifest.groups.every(({ signature, publicKey }) =>
      crypto.verify({ message, signature: Buffer.from(signature, 'hex'), publicKey }),
    )
  ) {
    return false;
  }

  return true;
};

const validateContractArgs = ({
  args,
  context,
}: {
  readonly args: readonly StackItem[];
  readonly context: ExecutionContext;
}): { readonly hash: UInt160; readonly script: Buffer; readonly manifestString: string } => {
  const script = args[0].asBuffer();
  if (script.length > MAX_ITEM_SIZE) {
    throw new ItemTooLargeError(context);
  }
  const manifestString = args[1].asString();
  if (manifestString.length > MAX_MANIFEST_LENGTH) {
    throw new ItemTooLargeError(context);
  }
  const hash = crypto.hash160(script);

  return { hash, script, manifestString };
};

const checkStorage = async ({ context, hash }: { readonly context: ExecutionContext; readonly hash: UInt160 }) => {
  const contract = await context.blockchain.contract.get({ hash });
  if (!contract.manifest.hasStorage) {
    throw new ContractNoStorageError(context, common.uInt160ToString(hash));
  }

  return contract;
};

function getContractFee<T>(func: (args: CreateSysCallArgs, fee: BN) => T): (args: CreateSysCallArgs) => T {
  return (args) => {
    const { context } = args;
    const byteSize = context.stack[0].size + context.stack[1].size;
    const fee = GAS_PER_BYTE.mul(new BN(byteSize));

    return func(args, fee);
  };
}

const destroyContract = async ({ context }: OpInvokeArgs) => {
  const hash = context.scriptHash;
  const contract = await context.blockchain.contract.tryGet({ hash });
  if (contract !== undefined) {
    await Promise.all([
      context.blockchain.contract.delete({ hash }),
      contract.manifest.hasStorage
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

// TODO: fix this
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

const createNative = ({ name }: { readonly name: NativeContractServiceName }) => ({
  context: contextIn,
}: CreateSysCallArgs) => {
  const contract = NativeContract[name];
  if ((contract as typeof contract | undefined) === undefined) {
    throw new UnknownNativeContractError(contextIn, name);
  }
  const methodName = contextIn.stack[0].asString();
  const price = contract.getPrice(methodName);

  return createSysCall({
    name,
    in: 2,
    out: 1,
    fee: price,
    invoke: ({ context, args, argsAlt }) => contract.invoke({ context, args, argsAlt }),
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

      return {
        context: {
          ...context,
          notifications: context.notifications.concat([{ scriptHash: context.scriptHash, args: args[0] }]),
        },
      };
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
          ? new BN(context.blockchain.currentBlock.timestamp).add(
              new BN(context.blockchain.settings.millisecondsPerBlock),
            )
          : persistingBlock.timestamp;

      return {
        context,
        results: [new IntegerStackItem(new BN(time))],
      };
    },
  }),

  'System.Binary.Serialize': createSysCall({
    name: 'System.Binary.Serialize',
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

  'System.Binary.Deserialize': createSysCall({
    name: 'System.Binary.Deserialize',
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
      const scriptHash = args[0].asBuffer().length === 0 ? undefined : args[0].asUInt160();
      const notifications =
        scriptHash === undefined
          ? context.notifications
          : context.notifications.filter((notification) => common.uInt160Equal(notification.scriptHash, scriptHash));

      return {
        context,
        results: [
          new ArrayStackItem(
            notifications.map(
              (notification) => new ArrayStackItem([new UInt160StackItem(notification.scriptHash), notification.args]),
            ),
          ),
        ],
      };
    },
  }),

  'System.Json.Serialize': createSysCall({
    name: 'System.Json.Serialize',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => ({
      context,
      results: [serializeJson(args[0])],
    }),
  }),

  'System.Json.Deserialize': createSysCall({
    name: 'System.Json.Deserialize',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => ({
      context,
      results: [deserializeJson(args[0].asString())],
    }),
  }),

  'Neo.Crypto.ECDsaVerify': createSysCall({
    name: 'Neo.Crypto.ECDsaVerify',
    in: 2,
    out: 1,
    fee: FEES[1_000_000],
    invoke: ({ context, args }) => {
      const publicKey = args[0].asECPoint();
      const signature = args[1].asBuffer();
      let result;
      try {
        result = crypto.verify({
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

  'Neo.Crypto.ECDsaCheckMultiSig': ({ context: contextIn }) => {
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
      name: 'Neo.Crypto.ECDsaCheckMultiSig',
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

  'System.Blockchain.GetTransactionFromBlock': createSysCall({
    name: 'System.Blockchain.GetTransactionFromBlock',
    in: 2,
    out: 1,
    fee: FEES[1_000_000],
    invoke: async ({ context, args }) => {
      const nullReturn = {
        context,
        results: [new NullStackItem()],
      };
      const hashOrIndex = getHashOrIndex({
        context,
        arg: args[0],
      });
      if (hashOrIndex === undefined) {
        throw new InvalidGetBlockArgumentsError(context, args[0].asBufferMaybe());
      }
      const block = await context.blockchain.block.tryGet({ hashOrIndex });

      if (block === undefined) {
        return nullReturn;
      }
      const index = args[1].asBigIntegerUnsafe().toNumber();
      if (index < 0 || index >= block.transactions.length) {
        throw new InvalidTransactionIndexError(context, index, block.transactions.length);
      }
      const transaction = await context.blockchain.transaction.tryGet({
        hash: block.transactions[index].hash,
      });

      if (transaction === undefined) {
        return nullReturn;
      }

      return {
        context,
        results: [new TransactionStackItem(transaction)],
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

  'System.Storage.Find': createSysCall({
    name: 'System.Storage.Find',
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

  'System.Storage.AsReadOnly': createSysCall({
    name: 'System.Storage.AsReadOnly',
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
    out: 0,
    fee: FEES[400],
    invoke: async ({ context }) => {
      if (context.init.persistingBlock === undefined) {
        throw new InvalidNativeDeployError(context, undefined);
      }
      if (context.init.persistingBlock.index !== 0) {
        throw new InvalidNativeDeployError(context, context.init.persistingBlock.index);
      }

      await Promise.all(
        Object.values(NativeContract).map(async (contract) =>
          Promise.all([
            contract.initialize(context),
            context.blockchain.contract.add(new Contract({ script: contract.script, manifest: contract.manifest })),
          ]),
        ),
      );

      return { context };
    },
  }),

  'Neo.Native.Policy': createNative({ name: 'Neo.Native.Policy' }),

  'Neo.Native.Tokens.GAS': createNative({ name: 'Neo.Native.Tokens.GAS' }),

  'Neo.Native.Tokens.NEO': createNative({ name: 'Neo.Native.Tokens.NEO' }),

  'System.Enumerator.Create': createSysCall({
    name: 'System.Enumerator.Create',
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

  'System.Enumerator.Next': createSysCall({
    name: 'System.Enumerator.Next',
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

  'System.Iterator.Create': createSysCall({
    name: 'System.Iterator.Create',
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

  'System.Iterator.Key': createSysCall({
    name: 'System.Iterator.Key',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => ({
      context,
      // tslint:disable-next-line no-any
      results: [args[0].asIterator().key() as any],
    }),
  }),

  'System.Enumerator.Value': createSysCall({
    name: 'System.Enumerator.Value',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => ({
      context,
      // tslint:disable-next-line no-any
      results: [args[0].asEnumerator().value() as any],
    }),
  }),

  'System.Enumerator.Concat': createSysCall({
    name: 'System.Enumerator.Concat',
    in: 2,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => ({
      context,
      results: [new EnumeratorStackItem(args[0].asEnumerator().concat(args[1].asEnumerator()))],
    }),
  }),

  'System.Iterator.Concat': createSysCall({
    name: 'System.Iterator.Concat',
    in: 2,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => ({
      context,
      results: [new IteratorStackItem(args[0].asIterator().concatIterator(args[1].asIterator()))],
    }),
  }),

  'System.Iterator.Keys': createSysCall({
    name: 'System.Iterator.Keys',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => ({
      context,
      results: [new EnumeratorStackItem(args[0].asIterator().keys())],
    }),
  }),

  'System.Iterator.Values': createSysCall({
    name: 'System.Iterator.Values',
    in: 1,
    out: 1,
    fee: FEES[400],
    invoke: async ({ context, args }) => ({
      context,
      results: [new EnumeratorStackItem(args[0].asIterator().values())],
    }),
  }),

  'System.Contract.IsStandard': createSysCall({
    name: 'System.Contract.IsStandard',
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

  'System.Contract.Create': getContractFee((argsIn, fee) =>
    createSysCall({
      name: 'System.Contract.Create',
      in: 2,
      out: 1,
      fee,
      invoke: async ({ context, args }) => {
        const { hash, script, manifestString } = validateContractArgs({ context, args });
        const tryContract = await context.blockchain.contract.tryGet({ hash });
        if (tryContract !== undefined) {
          throw new ContractAlreadyDeployedError(context, hash);
        }
        let manifestJson;
        try {
          manifestJson = JSON.parse(manifestString);
        } catch {
          throw new InvalidJsonError(context, manifestString);
        }
        const manifest = ContractManifest.fromJSON(manifestJson);
        const contract = new Contract({
          script,
          manifest,
        });
        if (!manifestIsValid({ manifest, hash })) {
          throw new InvalidContractManifestError(context, manifest);
        }

        await context.blockchain.contract.add(contract);

        return {
          context: {
            ...context,
            createdContracts: {
              ...context.createdContracts,
              [contract.manifest.hashHex]: context.scriptHash,
            },
          },
          results: [new ContractStackItem(contract)],
        };
      },
    })(argsIn),
  ),

  'System.Contract.Update': getContractFee((argsIn, fee) =>
    createSysCall({
      name: 'System.Contract.Update',
      in: 2,
      fee,
      invoke: async (options) => {
        const { context: contextIn, args } = options;
        let context = contextIn;
        const { hash, script, manifestString } = validateContractArgs({ context, args });

        let contract = await context.blockchain.contract.tryGet({ hash: context.scriptHash });
        if (contract === undefined) {
          throw new ContractHashNotFoundError(contextIn, context.scriptHash);
        }

        if (script.length > 0) {
          const tryHash = await context.blockchain.contract.tryGet({ hash });
          if (hash.equals(context.scriptHash) || tryHash !== undefined) {
            throw new ContractAlreadyDeployedError(context, hash);
          }
          contract = new Contract({
            script,
            manifest: new ContractManifest({
              abi: new ContractABI({
                hash,
                entryPoint: contract.manifest.abi.entryPoint,
                methods: contract.manifest.abi.methods,
                events: contract.manifest.abi.events,
              }),
              groups: contract.manifest.groups,
              features: contract.manifest.features,
              permissions: contract.manifest.permissions,
              trusts: contract.manifest.trusts,
              safeMethods: contract.manifest.safeMethods,
              extra: contract.manifest.extra,
            }),
          });

          await context.blockchain.contract.add(contract);

          if (contract.manifest.hasStorage) {
            await context.blockchain.storageItem
              .getAll$({ hash: context.scriptHash })
              .pipe(
                concatMap((item) =>
                  defer(async () =>
                    context.blockchain.storageItem.add(
                      new StorageItem({
                        hash: (contract as Contract).manifest.hash,
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
                [contract.manifest.hashHex]: context.scriptHash,
              },
            };
          }

          await destroyContract(options);
        }

        if (manifestString.length > 0) {
          let manifestJson;
          try {
            manifestJson = JSON.parse(manifestString);
          } catch {
            throw new InvalidJsonError(context, manifestString);
          }
          const newManifest = ContractManifest.fromJSON(manifestJson);
          contract = new Contract({
            script: contract.script,
            manifest: newManifest,
          });
          if (!manifestIsValid({ manifest: newManifest, hash: crypto.hash160(contract.script) })) {
            throw new InvalidContractManifestError(context, newManifest);
          }
          if (!contract.manifest.hasStorage) {
            const tryGetStorage = await context.blockchain.storageItem
              .getAll$({ hash: context.scriptHash })
              .pipe(toArray())
              .toPromise();

            if (tryGetStorage.length !== 0) {
              throw new InvalidContractManifestError(context, newManifest);
            }
          }
        }

        return { context };
      },
    })(argsIn),
  ),

  'System.Contract.Destroy': createSysCall({
    name: 'System.Contract.Destroy',
    fee: FEES[1_000_000],
    invoke: async (options) => {
      await destroyContract(options);

      return { context: options.context };
    },
  }),

  'System.Contract.Call': createSysCall({
    name: 'System.Contract.Call',
    in: 3,
    out: 2,
    fee: FEES[1_000_000],
    invoke: async ({ context, args }) => {
      const hash = args[0].asUInt160();
      const contractToCall = await context.blockchain.contract.tryGet({ hash });
      if (contractToCall === undefined) {
        throw new ContractHashNotFoundError(context, hash);
      }
      const contractMethod = args[1];
      const contractMethodString = contractMethod.asString();
      const contractArgs = args[2];
      const callingContract = await context.blockchain.contract.tryGet({ hash: context.scriptHash });
      if (callingContract === undefined) {
        throw new ContractHashNotFoundError(context, context.scriptHash);
      }
      if (!contractToCall.manifest.safeMethods.includes(contractMethodString)) {
        throw new ContractMethodUndefinedError(context, context.scriptHash, contractMethodString);
      }
      if (!canCall({ callingContract, contractToCall, method: contractMethodString })) {
        throw new InvalidPermissionError(context, context.scriptHash, contractMethodString);
      }

      const resultContext = await context.engine.executeScript({
        code: contractToCall.script,
        blockchain: context.blockchain,
        init: context.init,
        gasLeft: context.gasLeft,
        options: {
          stack: context.stack,
          stackAlt: context.stackAlt,
          depth: context.depth + 1,
          createdContracts: context.createdContracts,
          scriptHashStack: [hash, ...context.scriptHashStack],
          scriptHash: context.scriptHash,
          entryScriptHash: context.entryScriptHash,
          returnValueCount: -1,
          stackCount: context.stackCount,
          notifications: context.notifications,
          invocationCounter: context.invocationCounter,
        },
      });
      const returnContext = {
        state: resultContext.state === VMState.Halt ? context.state : resultContext.state,
        errorMessage: resultContext.errorMessage,
        blockchain: context.blockchain,
        init: context.init,
        engine: context.engine,
        notifications: resultContext.notifications,
        code: context.code,
        scriptHashStack: context.scriptHashStack,
        scriptHash: context.scriptHash,
        callingScriptHash: context.callingScriptHash,
        entryScriptHash: context.entryScriptHash,
        pc: context.pc,
        depth: context.depth,
        returnValueCount: context.returnValueCount,
        stackCount: resultContext.stackCount,
        stack: resultContext.stack,
        stackAlt: resultContext.stackAlt,
        gasLeft: resultContext.gasLeft,
        createdContracts: resultContext.createdContracts,
        invocationCounter: resultContext.invocationCounter,
      };

      return { context: returnContext, results: [contractArgs, contractMethod] };
    },
  }),

  'System.Contract.CallEx': createSysCall({
    name: 'System.Contract.CallEx',
    in: 4,
    out: 2,
    fee: FEES[1_000_000],
    invoke: ({ context, args }) => {
      // TODO: Spencer to implement

      return { context };
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

  'System.Runtime.GetScriptContainer': createSysCall({
    name: 'System.Runtime.GetScriptContainer',
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

  'System.Runtime.GetExecutingScriptHash': createSysCall({
    name: 'System.Runtime.GetExecutingScriptHash',
    out: 1,
    fee: FEES[400],
    invoke: async ({ context }) => ({
      context,
      results: [new UInt160StackItem(context.scriptHash)],
    }),
  }),

  'System.Runtime.GetCallingScriptHash': createSysCall({
    name: 'System.Runtime.GetCallingScriptHash',
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

  'System.Runtime.GetEntryScriptHash': createSysCall({
    name: 'System.Runtime.GetEntryScriptHash',
    out: 1,
    fee: FEES[400],
    invoke: async ({ context }) => ({
      context,
      results: [new UInt160StackItem(context.scriptHashStack[context.scriptHashStack.length - 1])],
    }),
  }),
};

export const SYSCALL_ALIASES: { readonly [key: string]: string | undefined } = {
  'System.Iterator.Next': 'System.Enumerator.Next',
  'System.Iterator.Value': 'System.Enumerator.Value',
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
