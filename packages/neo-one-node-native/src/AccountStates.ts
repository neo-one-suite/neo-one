import { common, ECPoint } from '@neo-one/client-common';
import {
  assertBooleanStackItem,
  assertBufferStackItem,
  assertIntegerStackItem,
  assertStructStackItem,
  StackItem,
  StructStackItem,
} from '@neo-one/node-core';
import { BN } from 'bn.js';

export interface AccountStateAdd {
  readonly balance: BN;
}

export class AccountState {
  public static fromStackItem(item: StructStackItem) {
    const integerItem = assertIntegerStackItem(item.array[0]);

    return {
      balance: integerItem.getInteger(),
    };
  }

  public readonly balance: BN;

  public constructor({ balance }: AccountStateAdd) {
    this.balance = balance;
  }
}

export interface NEOAccountStateAdd extends AccountStateAdd {
  readonly balanceHeight: BN;
  readonly voteTo?: ECPoint;
}

export class NEOAccountState extends AccountState {
  public static fromStackItem(item: StackItem) {
    const structItem = assertStructStackItem(item);
    const { balance } = super.fromStackItem(structItem);
    const balanceHeight = assertIntegerStackItem(structItem.array[1]).getInteger();
    const voteTo = structItem.array[2].isNull
      ? undefined
      : common.bufferToECPoint(assertBufferStackItem(structItem.array[2]).getBuffer());

    return new NEOAccountState({
      balance,
      balanceHeight,
      voteTo,
    });
  }

  public readonly balanceHeight: BN;
  public readonly voteTo?: ECPoint;

  public constructor(options: NEOAccountStateAdd) {
    super(options);
    this.balanceHeight = options.balanceHeight;
    this.voteTo = options.voteTo;
  }
}

export interface CandidateStateAdd {
  readonly registered: boolean;
  readonly votes: BN;
}

export class CandidateState {
  public static fromStackItem(item: StackItem) {
    const structItem = assertStructStackItem(item);
    const registered = assertBooleanStackItem(structItem.array[0]).getBoolean();
    const votes = assertIntegerStackItem(structItem.array[1]).getInteger();

    return new CandidateState({
      registered,
      votes,
    });
  }

  public readonly registered: boolean;
  public readonly votes: BN;

  public constructor({ registered = true, votes }: CandidateStateAdd) {
    this.registered = registered;
    this.votes = votes;
  }
}
