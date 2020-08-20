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
  Account,
  assertAssetType,
  Asset,
  AssetType,
  BinaryReader,
  Contract,
  InvocationTransaction,
  ScriptContainerType,
  StorageFlags,
  StorageItem,
  TransactionType,
  TriggerType,
  utils,
  Validator,
  Witness,
} from '@neo-one/node-core';
import { utils as commonUtils } from '@neo-one/utils';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { map as asyncMap } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/map';
import { BN } from 'bn.js';
import _ from 'lodash';
import { defer } from 'rxjs';
import { concatMap, map, toArray } from 'rxjs/operators';
import {
  BLOCK_HEIGHT_YEAR,
  ExecutionContext,
  FEES,
  MAX_ARRAY_SIZE,
  MAX_ITEM_SIZE,
  OpInvoke,
  OpInvokeArgs,
  SysCall,
} from './constants';
import {
  AccountFrozenError,
  BadWitnessCheckError,
  ConstantStorageError,
  ContainerTooLargeError,
  ContractNoStorageError,
  InvalidAssetTypeError,
  InvalidContractGetStorageContextError,
  InvalidGetBlockArgumentsError,
  InvalidGetHeaderArgumentsError,
  InvalidIndexError,
  InvalidInvocationTransactionError,
  InvalidVerifySyscallError,
  ItemTooLargeError,
  NotEligibleVoteError,
  StackUnderflowError,
  UnexpectedScriptContainerError,
  UnknownSysCallError,
} from './errors';
import {
  AccountStackItem,
  ArrayStackItem,
  AssetStackItem,
  AttributeStackItem,
  BlockStackItem,
  BooleanStackItem,
  BufferStackItem,
  ConsensusPayloadStackItem,
  ContractStackItem,
  deserializeStackItem,
  ECPointStackItem,
  EnumeratorStackItem,
  HeaderStackItem,
  InputStackItem,
  IntegerStackItem,
  IteratorStackItem,
  OutputStackItem,
  StackItem,
  StackItemEnumerator,
  StackItemIterator,
  StorageContextStackItem,
  TransactionStackItem,
  UInt160StackItem,
  UInt256StackItem,
  ValidatorStackItem,
  WitnessStackItem,
} from './stackItem';
import { vmUtils } from './vmUtils';

export interface CreateSysCallArgs {
  readonly context: ExecutionContext;
}
export type CreateSysCall = (input: CreateSysCallArgs) => SysCall;

export const createSysCall = ({
  name,
  in: _in = 0,
  inAlt = 0,
  out = 0,
  outAlt = 0,
  invocation = 0,
  fee = FEES.ONE,
  invoke,
}: {
  readonly name: SysCallName;
  readonly in?: number;
  readonly inAlt?: number;
  readonly out?: number;
  readonly outAlt?: number;
  readonly invocation?: number;
  readonly fee?: BN;
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

const createPut = ({ name }: { readonly name: 'Neo.Storage.Put' | 'Neo.Storage.PutEx' }) => ({
  context: contextIn,
}: CreateSysCallArgs) => {
  const keyIn = contextIn.stack[1] as StackItem | undefined;
  const valueIn = contextIn.stack[2] as StackItem | undefined;
  const expectedIn = name === 'Neo.Storage.Put' ? 3 : 4;
  if (keyIn === undefined || valueIn === undefined) {
    throw new StackUnderflowError(contextIn, 'SYSCALL', contextIn.stack.length, expectedIn);
  }
  const ratio = new BN(keyIn.asBuffer().length)
    .add(new BN(valueIn.asBuffer().length))
    .sub(utils.ONE)
    .div(utils.ONE_THOUSAND_TWENTY_FOUR)
    .add(utils.ONE);

  return createSysCall({
    name,
    in: expectedIn,
    fee: FEES.ONE_THOUSAND.mul(ratio),
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
        name === 'Neo.Storage.Put' ? StorageFlags.None : assertStorageFlags(args[3].asBigIntegerUnsafe().toNumber());
      const item = await context.blockchain.storageItem.tryGet({ hash, key });
      // if (item === undefined) {
      //   await context.blockchain.storageItem.add(new StorageItem({ hash, key, value, flags }));
      // } else if (hasStorageFlag(item.flags, StorageFlags.Constant)) {
      //   throw new ConstantStorageError(context, key);
      // } else {
      //   await context.blockchain.storageItem.update(item, { value, flags });
      // }
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

// TODO: PICKUP HERE
export const SYSCALLS: { readonly [K in SysCallEnum]: CreateSysCall } = {
  'System.Runtime.Platform': createSysCall({
    name: 'System.Runtime.Platform',
    out: 1,
    invoke: ({ context }) => ({
      context,
      results: [new BufferStackItem(Buffer.from('NEO', 'ascii'))],
    }),
  }),

  'Neo.Block.GetTransactionCount': createSysCall({
    name: 'Neo.Block.GetTransactionCount',
    in: 1,
    out: 1,
    invoke: ({ context, args }) => ({
      context,
      results: [new IntegerStackItem(new BN(args[0].asBlock().transactions.length))],
    }),
  }),

  'Neo.Account.GetScriptHash': createSysCall({
    name: 'Neo.Account.GetScriptHash',
    in: 1,
    out: 1,
    invoke: ({ context, args }) => ({
      context,
      results: [new UInt160StackItem(args[0].asAccount().hash)],
    }),
  }),

  'Neo.Asset.GetAssetId': createSysCall({
    name: 'Neo.Asset.GetAssetId',
    in: 1,
    out: 1,
    invoke: ({ context, args }) => ({
      context,
      results: [new UInt256StackItem(args[0].asAsset().hash)],
    }),
  }),

  'Neo.Storage.GetContext': createSysCall({
    name: 'Neo.Storage.GetContext',
    out: 1,
    invoke: ({ context }) => ({
      context,
      results: [new StorageContextStackItem(context.scriptHash)],
    }),
  }),

  // TODO: they maybe just changed the name of this one to System
  // 'Neo.Storage.Find': createSysCall({
  //   name: 'Neo.Storage.Find',
  //   in: 2,
  //   out: 1,
  //   invoke: async ({ context, args }) => {
  //     const hash = vmUtils.toStorageContext({ context, value: args[0] }).value;
  //     await checkStorage({ context, hash });

  //     const prefix = args[1].asBuffer();
  //     const iterable = AsyncIterableX.from<StorageItem>(context.blockchain.storageItem.getAll$({ hash, prefix })).pipe<{
  //       key: BufferStackItem;
  //       value: BufferStackItem;
  //     }>(
  //       asyncMap(({ key, value }) => ({
  //         key: new BufferStackItem(key),
  //         value: new BufferStackItem(value),
  //       })),
  //     );

  //     return {
  //       context,
  //       results: [new IteratorStackItem(new StackItemIterator(iterable[Symbol.asyncIterator]()))],
  //     };
  //   },
  // }),

  // TODO: base the new create syscall off of this one
  // 'Neo.Enumerator.Create': createSysCall({
  //   name: 'Neo.Enumerator.Create',
  //   in: 1,
  //   out: 1,
  //   invoke: async ({ context, args }) => {
  //     const iterable = AsyncIterableX.from(args[0].asArray().map((value) => ({ value })));

  //     return {
  //       context,
  //       results: [new EnumeratorStackItem(new StackItemEnumerator(iterable[Symbol.asyncIterator]()))],
  //     };
  //   },
  // }),

  'System.Enumerator.Next': createSysCall({
    name: 'System.Enumerator.Next',
    in: 1,
    out: 1,
    invoke: async ({ context, args }) => {
      const enumerator = args[0].asEnumerator();
      const value = await enumerator.next();

      return {
        context,
        results: [new BooleanStackItem(value)],
      };
    },
  }),

  'System.Enumerator.Value': createSysCall({
    name: 'System.Enumerator.Value',
    in: 1,
    out: 1,
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
    invoke: async ({ context, args }) => ({
      context,
      results: [new EnumeratorStackItem(args[0].asEnumerator().concat(args[1].asEnumerator()))],
    }),
  }),

  // TODO: base the new create syscall off of this
  // 'Neo.Iterator.Create': createSysCall({
  //   name: 'Neo.Iterator.Create',
  //   in: 1,
  //   out: 1,
  //   invoke: async ({ context, args }) => {
  //     const iterable = args[0].isArray()
  //       ? AsyncIterableX.from(
  //           args[0].asArray().map((value, idx) => ({
  //             key: new IntegerStackItem(new BN(idx)),
  //             value,
  //           })),
  //         )
  //       : AsyncIterableX.from(
  //           commonUtils
  //             .zip(args[0].asMapStackItem().keysArray(), args[0].asMapStackItem().valuesArray())
  //             .map(([key, value]) => ({ key, value })),
  //         );

  //     return {
  //       context,
  //       results: [new IteratorStackItem(new StackItemIterator(iterable[Symbol.asyncIterator]()))],
  //     };
  //   },
  // }),

  'System.Iterator.Key': createSysCall({
    name: 'System.Iterator.Key',
    in: 1,
    out: 1,
    invoke: async ({ context, args }) => ({
      context,
      // tslint:disable-next-line no-any
      results: [args[0].asIterator().key() as any],
    }),
  }),

  'System.Iterator.Concat': createSysCall({
    name: 'System.Iterator.Concat',
    in: 2,
    out: 1,
    invoke: async ({ context, args }) => ({
      context,
      results: [new IteratorStackItem(args[0].asIterator().concatIterator(args[1].asIterator()))],
    }),
  }),

  'System.Iterator.Keys': createSysCall({
    name: 'System.Iterator.Keys',
    in: 1,
    out: 1,
    invoke: async ({ context, args }) => ({
      context,
      results: [new EnumeratorStackItem(args[0].asIterator().keys())],
    }),
  }),

  'System.Iterator.Values': createSysCall({
    name: 'System.Iterator.Values',
    in: 1,
    out: 1,
    invoke: async ({ context, args }) => ({
      context,
      results: [new EnumeratorStackItem(args[0].asIterator().values())],
    }),
  }),

  'Neo.Account.SetVotes': createSysCall({
    name: 'Neo.Account.SetVotes',
    in: 2,
    fee: FEES.ONE_THOUSAND,
    invoke: async ({ context, args }) => {
      // This has been removed, but we keep it here so that we can do a full
      // build of the chain
      const address = args[0].asAccount().hash;
      const votes = args[1].asArray().map((vote) => vote.asECPoint());
      const account = await context.blockchain.account.get({ hash: address });
      const asset = context.blockchain.settings.governingToken.hashHex;
      const currentBalance = account.balances[asset];
      const balance = currentBalance === undefined ? utils.ZERO : currentBalance;
      if (account.isFrozen) {
        throw new AccountFrozenError(context);
      }
      if (balance.isZero() && votes.length > 0) {
        throw new NotEligibleVoteError(context);
      }
      const valid = await checkWitness({ context, hash: address });
      if (!valid) {
        throw new BadWitnessCheckError(context);
      }

      const newAccount = await context.blockchain.account.update(account, {
        votes,
      });

      if (context.init.listeners.onSetVotes !== undefined) {
        context.init.listeners.onSetVotes({ address, votes });
      }
      if (newAccount.isDeletable()) {
        await context.blockchain.account.delete({ hash: address });
      }

      return { context };
    },
  }),

  'Neo.Validator.Register': createSysCall({
    name: 'Neo.Validator.Register',
    in: 1,
    out: 1,
    fee: common.ONE_THOUSAND_FIXED8,
    invoke: async ({ context, args }) => {
      // This has been removed, but we keep it here so that we can do a full
      // build of the chain
      const publicKey = args[0].asECPoint();
      const valid = await checkWitnessPublicKey({ context, publicKey });
      if (!valid) {
        throw new BadWitnessCheckError(context);
      }

      let validator = await context.blockchain.validator.tryGet({ publicKey });
      if (validator === undefined) {
        validator = new Validator({ publicKey });
        await context.blockchain.validator.add(validator);
      }

      return {
        context,
        results: [new ValidatorStackItem(validator)],
      };
    },
  }),

  // TODO: check this contract create call when reimplementing
  // 'Neo.Contract.Create': getContractFee((argsIn, fee) =>
  //   createSysCall({
  //     name: 'Neo.Contract.Create',
  //     in: 9,
  //     out: 1,
  //     fee,
  //     invoke: async ({ context, args }) => {
  //       if (context.init.triggerType !== TriggerType.Application) {
  //         throw new InvalidVerifySyscallError(context, 'Neo.Contract.Create');
  //       }
  //       const { contract } = await createContract({ context, args });
  //       const result = new ContractStackItem(contract);

  //       return {
  //         context: {
  //           ...context,
  //           createdContracts: {
  //             ...context.createdContracts,
  //             [contract.hashHex]: context.scriptHash,
  //           },
  //         },

  //         results: [result],
  //       };
  //     },
  //   })(argsIn),
  // ),

  // TODO: might want to use this flow for System.Contract.Update?
  // 'Neo.Contract.Migrate': getContractFee((argsIn, fee) =>
  //   createSysCall({
  //     name: 'Neo.Contract.Migrate',
  //     in: 9,
  //     out: 1,
  //     fee,
  //     invoke: async (options) => {
  //       if (options.context.init.triggerType !== TriggerType.Application) {
  //         throw new InvalidVerifySyscallError(options.context, 'Neo.Contract.Migrate');
  //       }
  //       const { context: contextIn, args } = options;
  //       let context = contextIn;
  //       const { contract, created } = await createContract({ context, args });
  //       if (contract.hasStorage && created) {
  //         await context.blockchain.storageItem
  //           .getAll$({
  //             hash: context.scriptHash,
  //           })
  //           .pipe(
  //             concatMap((item) =>
  //               defer(async () =>
  //                 context.blockchain.storageItem.add(
  //                   new StorageItem({
  //                     hash: contract.hash,
  //                     key: item.key,
  //                     value: item.value,
  //                     flags: StorageFlags.None,
  //                   }),
  //                 ),
  //               ),
  //             ),
  //           )
  //           .toPromise();
  //         context = {
  //           ...context,
  //           createdContracts: {
  //             ...context.createdContracts,
  //             [contract.hashHex]: context.scriptHash,
  //           },
  //         };
  //       }

  //       await destroyContract(options);

  //       if (context.init.listeners.onMigrateContract !== undefined) {
  //         context.init.listeners.onMigrateContract({
  //           from: context.scriptHash,
  //           to: contract.hash,
  //         });
  //       }

  //       return {
  //         context,
  //         results: [new ContractStackItem(contract)],
  //       };
  //     },
  //   })(argsIn),
  // ),

  // TODO: Update this with new implementation
  // 'System.Contract.Destroy': createSysCall({
  //   name: 'System.Contract.Destroy',
  //   invoke: async (options) => {
  //     if (options.context.init.triggerType !== TriggerType.Application) {
  //       throw new InvalidVerifySyscallError(options.context, 'Neo.Contract.Destroy');
  //     }
  //     await destroyContract(options);

  //     return { context: options.context };
  //   },
  // }),

  'Neo.Storage.PutEx': createPut({ name: 'Neo.Storage.PutEx' }),
};

export const SYSCALL_ALIASES: { readonly [key: string]: string | undefined } = {
  'Neo.Iterator.Next': 'Neo.Enumerator.Next',
  'Neo.Iterator.Value': 'Neo.Enumerator.Value',
  'System.Runtime.GetTrigger': 'Neo.Runtime.GetTrigger',
  'System.Runtime.CheckWitness': 'Neo.Runtime.CheckWitness',
  'System.Runtime.Notify': 'Neo.Runtime.Notify',
  'System.Runtime.Log': 'Neo.Runtime.Log',
  'System.Runtime.GetTime': 'Neo.Runtime.GetTime',
  'System.Runtime.Deserialize': 'Neo.Runtime.Deserialize',
  'System.Blockchain.GetHeight': 'Neo.Blockchain.GetHeight',
  'System.Blockchain.GetHeader': 'Neo.Blockchain.GetHeader',
  'System.Blockchain.GetBlock': 'Neo.Blockchain.GetBlock',
  'System.Blockchain.GetTransaction': 'Neo.Blockchain.GetTransaction',
  'System.Blockchain.GetTransactionHeight': 'Neo.Blockchain.GetTransactionHeight',
  'System.Blockchain.GetContract': 'Neo.Blockchain.GetContract',
  'System.Header.GetHash': 'Neo.Header.GetHash',
  'System.Header.GetPrevHash': 'Neo.Header.GetPrevHash',
  'System.Header.GetTimestamp': 'Neo.Header.GetTimestamp',
  'System.Block.GetTransactionCount': 'Neo.Block.GetTransactionCount',
  'System.Block.GetTransactions': 'Neo.Block.GetTransactions',
  'System.Block.GetTransaction': 'Neo.Block.GetTransaction',
  'System.Transaction.GetHash': 'Neo.Transaction.GetHash',
  'System.Contract.Destroy': 'Neo.Contract.Destroy',
  'System.Contract.GetStorageContext': 'Neo.Contract.GetStorageContext',
  'System.Storage.GetContext': 'Neo.Storage.GetContext',
  'System.Storage.GetReadOnlyContext': 'Neo.Storage.GetReadOnlyContext',
  'System.Storage.Get': 'Neo.Storage.Get',
  'System.Storage.Put': 'Neo.Storage.Put',
  'System.Storage.Delete': 'Neo.Storage.Delete',
  'System.StorageContext.AsReadOnly': 'Neo.StorageContext.AsReadOnly',
  'AntShares.Runtime.CheckWitness': 'Neo.Runtime.CheckWitness',
  'AntShares.Runtime.Notify': 'Neo.Runtime.Notify',
  'AntShares.Runtime.Log': 'Neo.Runtime.Log',
  'AntShares.Blockchain.GetHeight': 'Neo.Blockchain.GetHeight',
  'AntShares.Blockchain.GetHeader': 'Neo.Blockchain.GetHeader',
  'AntShares.Blockchain.GetBlock': 'Neo.Blockchain.GetBlock',
  'AntShares.Blockchain.GetTransaction': 'Neo.Blockchain.GetTransaction',
  'AntShares.Blockchain.GetAccount': 'Neo.Blockchain.GetAccount',
  'AntShares.Blockchain.GetValidators': 'Neo.Blockchain.GetValidators',
  'AntShares.Blockchain.GetAsset': 'Neo.Blockchain.GetAsset',
  'AntShares.Blockchain.GetContract': 'Neo.Blockchain.GetContract',
  'AntShares.Header.GetHash': 'Neo.Header.GetHash',
  'AntShares.Header.GetVersion': 'Neo.Header.GetVersion',
  'AntShares.Header.GetPrevHash': 'Neo.Header.GetPrevHash',
  'AntShares.Header.GetMerkleRoot': 'Neo.Header.GetMerkleRoot',
  'AntShares.Header.GetTimestamp': 'Neo.Header.GetTimestamp',
  'AntShares.Header.GetConsensusData': 'Neo.Header.GetConsensusData',
  'AntShares.Header.GetNextConsensus': 'Neo.Header.GetNextConsensus',
  'AntShares.Block.GetTransactionCount': 'Neo.Block.GetTransactionCount',
  'AntShares.Block.GetTransactions': 'Neo.Block.GetTransactions',
  'AntShares.Block.GetTransaction': 'Neo.Block.GetTransaction',
  'AntShares.Transaction.GetHash': 'Neo.Transaction.GetHash',
  'AntShares.Transaction.GetType': 'Neo.Transaction.GetType',
  'AntShares.Transaction.GetAttributes': 'Neo.Transaction.GetAttributes',
  'AntShares.Transaction.GetInputs': 'Neo.Transaction.GetInputs',
  'AntShares.Transaction.GetOutputs': 'Neo.Transaction.GetOutputs',
  'AntShares.Transaction.GetReferences': 'Neo.Transaction.GetReferences',
  'AntShares.Attribute.GetUsage': 'Neo.Attribute.GetUsage',
  'AntShares.Attribute.GetData': 'Neo.Attribute.GetData',
  'AntShares.Input.GetHash': 'Neo.Input.GetHash',
  'AntShares.Input.GetIndex': 'Neo.Input.GetIndex',
  'AntShares.Output.GetAssetId': 'Neo.Output.GetAssetId',
  'AntShares.Output.GetValue': 'Neo.Output.GetValue',
  'AntShares.Output.GetScriptHash': 'Neo.Output.GetScriptHash',
  'AntShares.Account.GetScriptHash': 'Neo.Account.GetScriptHash',
  'AntShares.Account.GetVotes': 'Neo.Account.GetVotes',
  'AntShares.Account.GetBalance': 'Neo.Account.GetBalance',
  'AntShares.Asset.GetAssetId': 'Neo.Asset.GetAssetId',
  'AntShares.Asset.GetAssetType': 'Neo.Asset.GetAssetType',
  'AntShares.Asset.GetAmount': 'Neo.Asset.GetAmount',
  'AntShares.Asset.GetAvailable': 'Neo.Asset.GetAvailable',
  'AntShares.Asset.GetPrecision': 'Neo.Asset.GetPrecision',
  'AntShares.Asset.GetOwner': 'Neo.Asset.GetOwner',
  'AntShares.Asset.GetAdmin': 'Neo.Asset.GetAdmin',
  'AntShares.Asset.GetIssuer': 'Neo.Asset.GetIssuer',
  'AntShares.Contract.GetScript': 'Neo.Contract.GetScript',
  'AntShares.Storage.GetContext': 'Neo.Storage.GetContext',
  'AntShares.Storage.Get': 'Neo.Storage.Get',
  'AntShares.Account.SetVotes': 'Neo.Account.SetVotes',
  'AntShares.Validator.Register': 'Neo.Validator.Register',
  'AntShares.Asset.Create': 'Neo.Asset.Create',
  'AntShares.Asset.Renew': 'Neo.Asset.Renew',
  'AntShares.Contract.Create': 'Neo.Contract.Create',
  'AntShares.Contract.Migrate': 'Neo.Contract.Migrate',
  'AntShares.Contract.GetStorageContext': 'Neo.Contract.GetStorageContext',
  'AntShares.Contract.Destroy': 'Neo.Contract.Destroy',
  'AntShares.Storage.Put': 'Neo.Storage.Put',
  'AntShares.Storage.Delete': 'Neo.Storage.Delete',
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
