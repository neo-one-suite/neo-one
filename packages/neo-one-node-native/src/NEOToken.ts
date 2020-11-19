import { common, crypto, ECPoint, UInt160 } from '@neo-one/client-common';
import { BlockchainSettings, Candidate, NativeContractStorageContext, utils } from '@neo-one/node-core';
import { BN } from 'bn.js';
import _ from 'lodash';
import { filter, map, toArray } from 'rxjs/operators';
import { CandidateState, NEOAccountState } from './AccountStates';
import { GASToken } from './GASToken';
import { NEP5NativeContract } from './Nep5';

export class NEOToken extends NEP5NativeContract {
  public readonly totalAmount: BN;
  // TODO: investigate this usage, its a strange decimal value in C# world. `0.2M`. Something to do with rounding.
  public readonly effectiveVoterTurnout = 0.2;

  private readonly settings: BlockchainSettings;
  private readonly prefixes = {
    votersCount: Buffer.from([1]),
    candidate: Buffer.from([33]),
    nextValidators: Buffer.from([14]),
  };

  public constructor(settings: BlockchainSettings) {
    super({
      id: -1,
      name: 'NEO',
      symbol: 'neo',
      decimals: 0,
    });

    this.totalAmount = common.fixedFromDecimal(100000000, this.decimals);
    this.settings = settings;
  }

  public async totalSupply() {
    return this.totalAmount;
  }

  public async getCandidates(storage: NativeContractStorageContext): Promise<readonly Candidate[]> {
    const searchKey = this.createStorageKey(this.prefixes.candidate).toSearchPrefix();

    return storage.storages
      .find$(searchKey)
      .pipe(
        map(({ key, value }) => ({
          point: common.bufferToECPoint(key.key.slice(1)),
          state: utils.getInteroperable(value, CandidateState.fromStackItem),
        })),
        filter((value) => value.state.registered),
        // tslint:disable-next-line: no-useless-cast
        map(({ point, state }) => ({ publicKey: point, votes: state.votes })),
        toArray(),
      )
      .toPromise();
  }

  public async getValidators(storage: NativeContractStorageContext): Promise<readonly ECPoint[]> {
    const members = await this.getCommitteeMembers(storage);

    return members.slice(0, this.settings.validatorsCount).sort(common.ecPointCompare);
  }

  public async getCommittee(storage: NativeContractStorageContext): Promise<readonly ECPoint[]> {
    // tslint:disable-next-line: prefer-immediate-return
    const members = await this.getCommitteeMembers(storage);

    return members.slice().sort(common.ecPointCompare);
  }

  public async getCommitteeAddress(storage: NativeContractStorageContext): Promise<UInt160> {
    const committees = await this.getCommittee(storage);

    return crypto.toScriptHash(
      crypto.createMultiSignatureRedeemScript(committees.length - (committees.length - 1) / 2, committees),
    );
  }

  public async unclaimedGas({ storages }: NativeContractStorageContext, account: UInt160, end: number) {
    const storage = await storages.tryGet(this.createStorageKey(this.accountPrefix).addBuffer(account).toStorageKey());
    if (storage === undefined) {
      return new BN(0);
    }

    const state = utils.getInteroperable(storage, NEOAccountState.fromStackItem);

    return this.calculateBonus(state.balance, state.balanceHeight.toNumber(), end);
  }

  public async getNextBlockValidators({ storages }: NativeContractStorageContext): Promise<readonly ECPoint[]> {
    const key = this.createStorageKey(this.prefixes.nextValidators).toStorageKey();
    const storage = await storages.tryGet(key);
    if (storage === undefined) {
      return this.settings.standbyValidators;
    }

    return utils.getSerializableArrayFromStorageItem(storage, (reader) => reader.readECPoint());
  }

  private async getCommitteeMembers(storage: NativeContractStorageContext): Promise<readonly ECPoint[]> {
    const item = await storage.storages.get(this.createStorageKey(this.prefixes.votersCount).toStorageKey());
    const votersCount = new BN(item.value, 'le').toNumber();
    const voterTurnout = votersCount / this.totalAmount.toNumber();
    if (voterTurnout < this.effectiveVoterTurnout) {
      return this.settings.standbyCommittee;
    }

    const candidates = await this.getCandidates(storage);
    if (candidates.length < this.settings.committeeMembersCount) {
      return this.settings.standbyCommittee;
    }

    return _.sortBy(candidates, ['votes', ({ publicKey }) => common.ecPointToHex(publicKey)])
      .map(({ publicKey }) => publicKey)
      .slice(0, this.settings.committeeMembersCount);
  }

  private calculateBonus(value: BN, start: number, end: number) {
    if (value.isZero() || start >= end) {
      return new BN(0);
    }
    if (value.ltn(0)) {
      // TODO: create a real error for here
      throw new Error('negative value not supported');
    }

    let amount = new BN(0);
    let ustart = Math.floor(start / this.settings.decrementInterval);
    if (ustart < this.settings.generationAmount.length) {
      let istart = start % this.settings.decrementInterval;
      let uend = Math.floor(end / this.settings.decrementInterval);
      let iend = end % this.settings.decrementInterval;
      if (uend >= this.settings.generationAmount.length) {
        uend = this.settings.generationAmount.length;
        iend = 0;
      }
      if (iend === 0) {
        uend -= 1;
        iend = this.settings.decrementInterval;
      }
      // tslint:disable-next-line: no-loop-statement
      while (ustart < uend) {
        amount = amount.addn((this.settings.decrementInterval - istart) * this.settings.generationAmount[ustart]);
        ustart += 1;
        istart = 0;
      }
      amount = amount.addn((iend - istart) * this.settings.generationAmount[ustart]);
    }

    return common
      .fixedFromDecimal(amount.mul(value), GASToken.decimals)
      .mul(new BN(10 ** GASToken.decimals))
      .div(this.totalAmount);
  }
}
