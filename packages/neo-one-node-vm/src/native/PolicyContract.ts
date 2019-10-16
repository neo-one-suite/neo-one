import { common, UInt160 } from '@neo-one/client-common';
import {
  BinaryReader,
  ContractParameterDeclaration,
  ContractParameterType,
  StorageFlags,
  StorageItem,
} from '@neo-one/node-core';
import { BN } from 'bn.js';
import { ExecutionContext, FEES, MAX_PAYLOAD_SIZE, OpInvokeArgs } from '../constants';
import { MaxPayloadExceededError } from '../errors';
import { ArrayStackItem, BooleanStackItem, IntegerStackItem, UInt160StackItem } from '../stackItem';
import { ContractMethodData, createStorageKey, NativeContractBase } from './NativeContractBase';

const extractUInt160Array = (buff: Buffer): readonly UInt160[] => {
  const reader = new BinaryReader(buff);
  const result: UInt160[] = [];
  // tslint:disable-next-line no-loop-statement
  while (reader.hasMore()) {
    // tslint:disable-next-line no-array-mutation
    result.push(common.asUInt160(reader.readUInt160()));
  }

  return result;
};

export const POLICY_METHODS: readonly ContractMethodData[] = [
  {
    name: 'getMaxTransactionsPerBlock',
    price: FEES[1_000_000],
    returnType: ContractParameterType.Integer,
    parameters: [],
    safeMethod: true,
    delegate: (contract: NativeContractBase) => async ({ context }: OpInvokeArgs) => {
      const storageItem = await context.blockchain.storageItem.get(
        createStorageKey(contract.hash, PolicyContract.prefixMaxTransactionsPerBlock),
      );

      return new IntegerStackItem(new BN(storageItem.value));
    },
  },
  {
    name: 'getMaxBlockSize',
    price: FEES[1_000_000],
    returnType: ContractParameterType.Integer,
    parameters: [],
    safeMethod: true,
    delegate: (contract: NativeContractBase) => async ({ context }: OpInvokeArgs) => {
      const storageItem = await context.blockchain.storageItem.get(
        createStorageKey(contract.hash, PolicyContract.prefixMaxBlockSize),
      );

      return new IntegerStackItem(new BN(storageItem.value));
    },
  },
  {
    name: 'getFeePerByte',
    price: FEES[1_000_000],
    returnType: ContractParameterType.Integer,
    parameters: [],
    safeMethod: true,
    delegate: (contract: NativeContractBase) => async ({ context }: OpInvokeArgs) => {
      const storageItem = await context.blockchain.storageItem.get(
        createStorageKey(contract.hash, PolicyContract.prefixFeePerByte),
      );

      return new IntegerStackItem(new BN(storageItem.value));
    },
  },

  {
    name: 'getBlockedAccounts',
    price: FEES[1_000_000],
    returnType: ContractParameterType.Array,
    parameters: [],
    safeMethod: true,
    delegate: (contract: NativeContractBase) => async ({ context }: OpInvokeArgs) => {
      const storageItem = await context.blockchain.storageItem.get(
        createStorageKey(contract.hash, PolicyContract.prefixBlockedAccounts),
      );

      return new ArrayStackItem(extractUInt160Array(storageItem.value).map((uint160) => new UInt160StackItem(uint160)));
    },
  },

  {
    name: 'setMaxBlockSize',
    price: FEES[3_000_000],
    returnType: ContractParameterType.Boolean,
    parameters: [new ContractParameterDeclaration({ type: ContractParameterType.Integer, name: 'value' })],
    safeMethod: false,
    delegate: (contract: NativeContractBase) => async ({ context, args }: OpInvokeArgs) => {
      const value = args[0].asBigInteger();

      if (value.gt(MAX_PAYLOAD_SIZE)) {
        throw new MaxPayloadExceededError(context);
      }

      const storageItem = await context.blockchain.storageItem.get(
        createStorageKey(contract.hash, PolicyContract.prefixMaxBlockSize),
      );

      await context.blockchain.storageItem.update(storageItem, {
        value: args[0].asBuffer(),
        flags: StorageFlags.None,
      });

      return new BooleanStackItem(true);
    },
  },

  {
    name: 'setMaxTransactionsPerBlock',
    price: FEES[3_000_000],
    returnType: ContractParameterType.Boolean,
    parameters: [new ContractParameterDeclaration({ type: ContractParameterType.Integer, name: 'value' })],
    safeMethod: false,
    delegate: (contract: NativeContractBase) => async ({ context, args }: OpInvokeArgs) => {
      const value = args[0].asBuffer();

      const storageItem = await context.blockchain.storageItem.get(
        createStorageKey(contract.hash, PolicyContract.prefixMaxTransactionsPerBlock),
      );

      await context.blockchain.storageItem.update(storageItem, { value, flags: StorageFlags.None });

      return new BooleanStackItem(true);
    },
  },

  {
    name: 'setFeePerByte',
    price: FEES[3_000_000],
    returnType: ContractParameterType.Boolean,
    parameters: [new ContractParameterDeclaration({ type: ContractParameterType.Integer, name: 'value' })],
    safeMethod: false,
    delegate: (contract: NativeContractBase) => async ({ context, args }: OpInvokeArgs) => {
      const value = args[0].asBuffer();

      const storageItem = await context.blockchain.storageItem.get(
        createStorageKey(contract.hash, PolicyContract.prefixFeePerByte),
      );

      await context.blockchain.storageItem.update(storageItem, { value, flags: StorageFlags.None });

      return new BooleanStackItem(true);
    },
  },

  {
    name: 'blockAccount',
    price: FEES[3_000_000],
    returnType: ContractParameterType.Boolean,
    parameters: [new ContractParameterDeclaration({ type: ContractParameterType.Hash160, name: 'account' })],
    safeMethod: false,
    delegate: (contract: NativeContractBase) => async ({ context, args }: OpInvokeArgs) => {
      const newAccount = args[0].asUInt160();
      const key = createStorageKey(contract.hash, PolicyContract.prefixBlockedAccounts);

      const storageItem = await context.blockchain.storageItem.get(key);
      const blockedAccounts = new Set(extractUInt160Array(storageItem.value));
      blockedAccounts.add(newAccount);

      await context.blockchain.storageItem.update(storageItem, {
        value: Buffer.concat(Array.from(blockedAccounts).map((account) => common.uInt160ToBuffer(account))),
        flags: StorageFlags.None,
      });

      return new BooleanStackItem(true);
    },
  },

  {
    name: 'unblockAccount',
    price: FEES[3_000_000],
    returnType: ContractParameterType.Boolean,
    parameters: [new ContractParameterDeclaration({ type: ContractParameterType.Hash160, name: 'account' })],
    safeMethod: false,
    delegate: (contract: NativeContractBase) => async ({ context, args }: OpInvokeArgs) => {
      const delAccount = args[0].asUInt160();
      const key = createStorageKey(contract.hash, PolicyContract.prefixBlockedAccounts);

      const storageItem = await context.blockchain.storageItem.get(key);
      const blockedAccounts = new Set(extractUInt160Array(storageItem.value));
      blockedAccounts.delete(delAccount);

      await context.blockchain.storageItem.update(storageItem, {
        value: Buffer.concat(Array.from(blockedAccounts).map((account) => common.uInt160ToBuffer(account))),
        flags: StorageFlags.None,
      });

      return new BooleanStackItem(true);
    },
  },
];

export class PolicyContract extends NativeContractBase {
  public static readonly prefixMaxTransactionsPerBlock = Buffer.from([0x17]);
  public static readonly prefixFeePerByte = Buffer.from([0x0a]);
  public static readonly prefixBlockedAccounts = Buffer.from([0x0f]);
  public static readonly prefixMaxBlockSize = Buffer.from([0x10]);

  public constructor() {
    super({ serviceName: 'Neo.Native.Policy', methods: POLICY_METHODS });
  }

  public async initialize(context: ExecutionContext): Promise<boolean> {
    if (this.initializeBase(context)) {
      await context.blockchain.storageItem.add(
        new StorageItem({
          ...this.createStorageKey(PolicyContract.prefixMaxBlockSize),
          value: new BN(1024 * 256).toBuffer('le'),
          flags: StorageFlags.None,
        }),
      );

      await context.blockchain.storageItem.add(
        new StorageItem({
          ...this.createStorageKey(PolicyContract.prefixMaxTransactionsPerBlock),
          value: new BN(512).toBuffer('le'),
          flags: StorageFlags.None,
        }),
      );

      await context.blockchain.storageItem.add(
        new StorageItem({
          ...this.createStorageKey(PolicyContract.prefixFeePerByte),
          value: new BN(1000).toBuffer('le'),
          flags: StorageFlags.None,
        }),
      );

      await context.blockchain.storageItem.add(
        new StorageItem({
          ...this.createStorageKey(PolicyContract.prefixBlockedAccounts),
          value: Buffer.alloc(20, 0),
          flags: StorageFlags.None,
        }),
      );
    }

    return true;
  }

  public isPolicy(): boolean {
    return this instanceof PolicyContract;
  }
}
