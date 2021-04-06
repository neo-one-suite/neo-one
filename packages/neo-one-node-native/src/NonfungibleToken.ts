import { UInt160 } from '@neo-one/client-common';
import {
  assertArrayStackItem,
  assertStructStackItem,
  NativeContractStorageContext,
  NonfungibleToken as NonfungibleTokenNode,
  StackItem,
  utils,
} from '@neo-one/node-core';
import { BN } from 'bn.js';
import { map, toArray } from 'rxjs/operators';
import { AccountState } from './AccountStates';
import { NativeContract, NativeContractAdd } from './NativeContract';
import { NFTState } from './NFTState';

export interface NonfungibleTokenAdd extends NativeContractAdd {
  readonly symbol: string;
}

export abstract class NonfungibleToken extends NativeContract implements NonfungibleTokenNode {
  public readonly symbol: string;
  public readonly decimals: number = 0;

  protected readonly basePrefixes = {
    totalSupply: Buffer.from([11]),
    account: Buffer.from([7]),
    token: Buffer.from([5]),
  };

  public constructor(options: NonfungibleTokenAdd) {
    super(options);
    this.symbol = options.symbol;
  }

  public async totalSupply({ storages }: NativeContractStorageContext) {
    // TODO: not sure this is implemented correctly
    const maybeSupply = await storages.tryGet(this.createStorageKey(this.basePrefixes.totalSupply).toStorageKey());
    if (maybeSupply === undefined) {
      return new BN(0);
    }

    return new BN(maybeSupply.value);
  }

  // TODO: checkn input. should it be a BN?
  public async ownerOf({ storages }: NativeContractStorageContext, tokenId: Buffer) {
    const maybeToken = await storages.tryGet(
      this.createStorageKey(this.basePrefixes.token).addBuffer(this.getKey(tokenId)).toStorageKey(),
    );

    // TODO: should this be try or tryGet()?
    if (maybeToken === undefined) {
      throw new Error();
    }

    // TODO: need to add generic type input to this class for this?
    return utils.getInteroperable(maybeToken, NFTState.fromStackItem).owner;
  }

  // TODO: might need to add properties method

  public async balanceOf({ storages }: NativeContractStorageContext, owner: UInt160) {
    const maybeBalance = await storages.tryGet(
      this.createStorageKey(this.basePrefixes.account).addBuffer(owner).toStorageKey(),
    );

    if (maybeBalance === undefined) {
      return new BN(0);
    }

    return utils.getInteroperable(maybeBalance, NFTAccountState.fromStackItem).balance;
  }

  public async tokens({ storages }: NativeContractStorageContext) {
    return storages
      .find$(this.createStorageKey(this.basePrefixes.token).toSearchPrefix())
      .pipe(
        map(
          // TODO: need to deserialze/conver to array stack item, then get index 1 of that array
          ({ value }) => value,
        ),
        toArray(),
      )
      .toPromise();
  }

  public async tokensOf({ storages }: NativeContractStorageContext, owner: UInt160) {
    const account = await storages.tryGet(
      this.createStorageKey(this.basePrefixes.account).addBuffer(owner).toStorageKey(),
    );
    if (account === undefined) {
      return [];
    }

    const accountState = utils.getInteroperable(account, NFTAccountState.fromStackItem);

    return accountState.tokens;
  }

  protected getKey(tokenId: Buffer) {
    return tokenId;
  }
}

interface NFTAccountStateAdd {
  readonly tokens: readonly Buffer[];
  readonly balance: BN;
}

class NFTAccountState extends AccountState {
  public static fromStackItem(stackItem: StackItem) {
    const struct = assertStructStackItem(stackItem);
    const state = super.fromStackItem(struct);
    const { array } = assertArrayStackItem(struct.array[1]);
    const tokens = array.map((item) => item.getBuffer());

    return new NFTAccountState({ tokens, balance: state.balance });
  }

  public readonly tokens: readonly Buffer[];

  public constructor({ tokens, balance }: NFTAccountStateAdd) {
    super({ balance });
    this.tokens = tokens;
  }
}
