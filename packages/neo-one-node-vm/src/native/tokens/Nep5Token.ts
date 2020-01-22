import { common, UInt160 } from '@neo-one/client-common';
import { HasPayable } from '@neo-one/client-full-common';
import { ContractParameterDeclaration, ContractParameterType, StorageFlags, StorageItem } from '@neo-one/node-core';
import { BN } from 'bn.js';
import { ExecutionContext, FEES, OpInvokeArgs } from '../../constants';
import { InvalidAmountError, InvalidNep5TokenError } from '../../errors';
import { BooleanStackItem, IntegerStackItem, StringStackItem } from '../../stackItem';
import { checkWitness } from '../../syscalls';
import { createStorageKey, NativeContractBase, NativeContractOptions } from '../NativeContractBase';
import { Nep5AccountState } from './Nep5AccountState';

export interface Nep5ContractOptions extends NativeContractOptions {
  readonly name: string;
  readonly symbol: string;
  readonly decimals: BN;
  readonly onBalanceChange: (
    context: ExecutionContext,
    account: UInt160,
    accountState: Nep5AccountState,
    amount: BN,
  ) => void;
}

export const createAccountKey = (hash: UInt160, account: UInt160) =>
  createStorageKey(hash, Nep5Token.prefixAccount, account);

export const NEP5_METHODS = (
  onBalanceChange: (context: ExecutionContext, account: UInt160, accountState: Nep5AccountState, amount: BN) => void,
) => [
  {
    name: 'name',
    price: FEES[0],
    returnType: ContractParameterType.String,
    parameters: [],
    safeMethod: true,
    delegate: (contract: NativeContractBase) => async ({ context }: OpInvokeArgs) => {
      if (contract.isNep5()) {
        return new StringStackItem((contract as Nep5Token).name);
      }
      throw new InvalidNep5TokenError(context, contract.serviceName);
    },
  },
  {
    name: 'symbol',
    price: FEES[0],
    returnType: ContractParameterType.String,
    parameters: [],
    safeMethod: true,
    delegate: (contract: NativeContractBase) => async ({ context }: OpInvokeArgs) => {
      if (contract.isNep5()) {
        return new StringStackItem((contract as Nep5Token).symbol);
      }
      throw new InvalidNep5TokenError(context, contract.serviceName);
    },
  },
  {
    name: 'decimals',
    price: FEES[0],
    returnType: ContractParameterType.Integer,
    parameters: [],
    safeMethod: true,
    delegate: (contract: NativeContractBase) => async ({ context }: OpInvokeArgs) => {
      if (contract.isNep5()) {
        return new IntegerStackItem((contract as Nep5Token).decimals);
      }
      throw new InvalidNep5TokenError(context, contract.serviceName);
    },
  },
  {
    name: 'totalSupply',
    price: FEES[1_000_000],
    returnType: ContractParameterType.Integer,
    parameters: [],
    safeMethod: true,
    delegate: (contract: NativeContractBase) => async ({ context }: OpInvokeArgs) => {
      const storageItem = await context.blockchain.storageItem.tryGet(
        createStorageKey(contract.hash, Nep5Token.prefixTotalSupply),
      );
      if (storageItem === undefined) {
        return new IntegerStackItem(new BN(0));
      }

      return new IntegerStackItem(new BN(storageItem.value));
    },
  },
  {
    name: 'balanceOf',
    price: FEES[1_000_000],
    returnType: ContractParameterType.Integer,
    parameters: [new ContractParameterDeclaration({ type: ContractParameterType.Hash160, name: 'account' })],
    safeMethod: true,
    delegate: (contract: NativeContractBase) => async ({ context, args }: OpInvokeArgs) => {
      const account = args[0].asUInt160();
      const storageItem = await context.blockchain.storageItem.tryGet(createAccountKey(contract.hash, account));

      if (storageItem === undefined) {
        return new IntegerStackItem(new BN(0));
      }

      return new IntegerStackItem(new BN(storageItem.value));
    },
  },
  {
    name: 'transfer',
    price: FEES[8_000_000],
    returnType: ContractParameterType.Boolean,
    parameters: [
      new ContractParameterDeclaration({ type: ContractParameterType.Hash160, name: 'from' }),
      new ContractParameterDeclaration({ type: ContractParameterType.Hash160, name: 'to' }),
      new ContractParameterDeclaration({ type: ContractParameterType.Integer, name: 'amount' }),
    ],
    safeMethod: false,
    delegate: (contract: NativeContractBase) => async ({ context, args }: OpInvokeArgs) => {
      const from = args[0].asUInt160();
      const to = args[1].asUInt160();
      const amount = args[2].asBigInteger();

      if (amount.lt(new BN(0))) {
        throw new InvalidAmountError(context, '0', amount.toString());
      }
      const witnessResult = await checkWitness({ context, hash: from });
      if (context.scriptHash !== from && !witnessResult) {
        return new BooleanStackItem(false);
      }
      const contractTo = await context.blockchain.contract.tryGet({ hash: to });
      if (contractTo !== undefined && !HasPayable.has(contractTo.manifest.features)) {
        return new BooleanStackItem(false);
      }
      const keyFrom = createAccountKey(contract.hash, from);
      const storageFrom = await context.blockchain.storageItem.tryGet(keyFrom);

      if (amount.eq(new BN(0))) {
        if (storageFrom !== undefined) {
          const stateFrom = new Nep5AccountState(storageFrom);
          onBalanceChange(context, from, stateFrom, amount);
        }
      } else {
        if (storageFrom === undefined) {
          return new BooleanStackItem(false);
        }

        const stateFrom = new Nep5AccountState(storageFrom);

        if (stateFrom.mutableBalance.lt(amount)) {
          return new BooleanStackItem(false);
        }
        if (common.uInt160ToHex(from) === common.uInt160ToHex(to)) {
          onBalanceChange(context, from, stateFrom, new BN(0));
        } else {
          onBalanceChange(context, from, stateFrom, amount.neg());
          if (stateFrom.mutableBalance.eq(amount)) {
            await context.blockchain.storageItem.delete(keyFrom);
          } else {
            stateFrom.updateBalance(amount.neg());
            await context.blockchain.storageItem.update(storageFrom, {
              value: stateFrom.mutableBalance.toBuffer(),
              flags: StorageFlags.None,
            });
          }
          const keyTo = createAccountKey(contract.hash, to);
          const storageTo = await context.blockchain.storageItem.tryGet(keyTo);
          const stateTo = new Nep5AccountState(storageTo);
          onBalanceChange(context, to, stateTo, amount);
          stateTo.updateBalance(amount);

          if (storageTo === undefined) {
            await context.blockchain.storageItem.add(
              new StorageItem({
                hash: keyTo.hash,
                key: keyTo.key,
                value: amount.toBuffer(),
                flags: StorageFlags.None,
              }),
            );
          } else {
            await context.blockchain.storageItem.update(storageTo, {
              value: stateTo.mutableBalance.toBuffer(),
              flags: StorageFlags.None,
            });
          }
        }
      }

      if (context.init.listeners.onNotify !== undefined) {
        context.init.listeners.onNotify({ scriptHash: contract.hash, args: [] });
      }

      return new BooleanStackItem(true);
    },
  },
];

export class Nep5Token extends NativeContractBase {
  public static readonly prefixTotalSupply: Buffer = Buffer.from([0x11]);
  public static readonly prefixAccount: Buffer = Buffer.from([0x20]);
  public readonly supportedStandards: readonly string[] = ['NEP-5', 'NEP-10'];
  public readonly name: string;
  public readonly symbol: string;
  public readonly decimals: BN;
  public readonly factor: BN;
  private readonly onBalanceChange: (
    context: ExecutionContext,
    account: UInt160,
    accountState: Nep5AccountState,
    amount: BN,
  ) => void;

  public constructor({ serviceName, methods, onBalanceChange, name, symbol, decimals }: Nep5ContractOptions) {
    super({ serviceName, methods: methods.concat(NEP5_METHODS(onBalanceChange)) });
    this.onBalanceChange = onBalanceChange;
    this.name = name;
    this.symbol = symbol;
    this.decimals = decimals;
    this.factor = new BN(10).pow(this.decimals);
  }

  public isNep5(): boolean {
    return this instanceof Nep5Token;
  }

  protected async mint(context: ExecutionContext, account: UInt160, amount: BN): Promise<void> {
    if (amount.lt(new BN(0))) {
      throw new InvalidAmountError(context, '0', amount.toString());
    }
    if (amount.eq(new BN(0))) {
      return;
    }
    const accountKey = createAccountKey(this.hash, account);
    const accountStorageItem = await context.blockchain.storageItem.tryGet(accountKey);
    const accountState = new Nep5AccountState(accountStorageItem);

    this.onBalanceChange(context, account, accountState, amount);
    accountState.updateBalance(amount);

    const totalSupplyKey = createStorageKey(this.hash, Nep5Token.prefixTotalSupply);
    const totalSupplyStorageItem = await context.blockchain.storageItem.tryGet(totalSupplyKey);
    if (totalSupplyStorageItem === undefined) {
      await context.blockchain.storageItem.add(
        new StorageItem({
          hash: totalSupplyKey.hash,
          key: totalSupplyKey.key,
          value: accountState.mutableBalance.toBuffer(),
          flags: StorageFlags.None,
        }),
      );
    } else {
      await context.blockchain.storageItem.update(totalSupplyStorageItem, {
        value: new BN(totalSupplyStorageItem.value).add(accountState.mutableBalance).toBuffer(),
        flags: StorageFlags.None,
      });
    }

    if (context.init.listeners.onNotify !== undefined) {
      context.init.listeners.onNotify({ scriptHash: this.hash, args: [] });
    }
  }

  protected async burn(context: ExecutionContext, account: UInt160, amount: BN): Promise<void> {
    if (amount.lt(new BN(0))) {
      throw new InvalidAmountError(context, '0', amount.toString());
    }
    if (amount.eq(new BN(0))) {
      return;
    }
    const accountKey = createAccountKey(this.hash, account);
    const accountStorageItem = await context.blockchain.storageItem.get(accountKey);
    const accountState = new Nep5AccountState(accountStorageItem);
    if (accountState.mutableBalance.lt(amount)) {
      throw new InvalidAmountError(context, 'amount', accountState.mutableBalance.toString());
    }
    this.onBalanceChange(context, account, accountState, amount.neg());
    if (accountState.mutableBalance.eq(amount)) {
      await context.blockchain.storageItem.delete(accountKey);
    } else {
      await context.blockchain.storageItem.update(accountStorageItem, {
        value: accountState.mutableBalance.sub(amount).toBuffer(),
        flags: StorageFlags.None,
      });
    }

    const totalSupplyKey = createStorageKey(this.hash, Nep5Token.prefixTotalSupply);
    const totalSupplyStorageItem = await context.blockchain.storageItem.get(totalSupplyKey);
    await context.blockchain.storageItem.update(totalSupplyStorageItem, {
      value: new BN(totalSupplyStorageItem.value).sub(amount).toBuffer(),
      flags: StorageFlags.None,
    });

    if (context.init.listeners.onNotify !== undefined) {
      context.init.listeners.onNotify({ scriptHash: this.hash, args: [] });
    }
  }
}
