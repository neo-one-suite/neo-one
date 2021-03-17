import { common, crypto, ECPoint, InvalidFormatError, UInt160 } from '@neo-one/client-common';
import { BlockchainSettings, Candidate, NativeContractStorageContext, NEOContract, utils } from '@neo-one/node-core';
import { BN } from 'bn.js';
import _ from 'lodash';
import { filter, map, toArray } from 'rxjs/operators';
import { CandidateState, NEOAccountState } from './AccountStates';
import { CachedCommittee } from './CachedCommittee';
import { FungibleToken } from './FungibleToken';
import { neoTokenMethods } from './methods';

type Storages = NativeContractStorageContext['storages'];

interface CalculateBonusOptions {
  readonly storages: Storages;
  readonly vote?: ECPoint;
  readonly value: BN;
  readonly start: number;
  readonly end: number;
}

interface GasRecord {
  readonly index: number;
  readonly gasPerBlock: BN;
}

const candidateSort = (a: Candidate, b: Candidate) => {
  const voteComp = a.votes.cmp(b.votes);
  if (voteComp !== 0) {
    return voteComp;
  }

  return a.publicKey.compare(b.publicKey);
};

export class NEOToken extends FungibleToken implements NEOContract {
  public readonly totalAmount: BN;
  public readonly effectiveVoterTurnout = 0.2;

  private readonly settings: BlockchainSettings;
  private readonly prefixes = {
    votersCount: Buffer.from([1]),
    candidate: Buffer.from([33]),
    committee: Buffer.from([14]),
    gasPerBlock: Buffer.from([29]),
    voterRewardPerCommittee: Buffer.from([23]),
  };

  private readonly ratios = {
    neoHolderReward: 10,
    committeeReward: 10,
    voterReward: 80,
  };

  public constructor(settings: BlockchainSettings) {
    super({
      name: 'NeoToken',
      symbol: 'NEO',
      decimals: 0,
      methods: neoTokenMethods,
      settings,
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
        map(({ point, state }) => ({ publicKey: point, votes: state.votes })),
        toArray(),
      )
      .toPromise();
  }

  public async getCommittee(storage: NativeContractStorageContext): Promise<readonly ECPoint[]> {
    const cache = await this.getCommitteeFromCache(storage);

    return cache.members.map(({ publicKey }) => publicKey).sort(common.ecPointCompare);
  }

  public async getCommitteeAddress(storage: NativeContractStorageContext): Promise<UInt160> {
    const committee = await this.getCommittee(storage);

    return crypto.toScriptHash(
      crypto.createMultiSignatureRedeemScript(committee.length - (committee.length - 1) / 2, committee),
    );
  }

  public async getCommitteeFromCache({ storages }: NativeContractStorageContext): Promise<CachedCommittee> {
    const item = await storages.get(this.createStorageKey(this.prefixes.committee).toStorageKey());

    return utils.getInteroperable(item, CachedCommittee.fromStackItem);
  }

  public async computeNextBlockValidators(storage: NativeContractStorageContext): Promise<readonly ECPoint[]> {
    const committeeMembers = await this.computeCommitteeMembers(storage);

    return _.take(
      committeeMembers.map(({ publicKey }) => publicKey),
      this.settings.validatorsCount,
    )
      .slice()
      .sort(common.ecPointCompare);
  }

  public async unclaimedGas({ storages }: NativeContractStorageContext, account: UInt160, end: number) {
    const storage = await storages.tryGet(
      this.createStorageKey(this.basePrefixes.account).addBuffer(account).toStorageKey(),
    );
    if (storage === undefined) {
      return new BN(0);
    }

    const state = utils.getInteroperable(storage, NEOAccountState.fromStackItem);

    return this.calculateBonus({
      storages,
      vote: state.voteTo,
      value: state.balance,
      start: state.balanceHeight.toNumber(),
      end,
    });
  }

  public async getNextBlockValidators(storage: NativeContractStorageContext): Promise<readonly ECPoint[]> {
    const committeeCache = await this.getCommitteeFromCache(storage);

    return _.take(committeeCache.members, this.settings.validatorsCount)
      .map(({ publicKey }) => publicKey)
      .sort(common.ecPointCompare);
  }

  private async calculateBonus({ storages, vote, value, start, end }: CalculateBonusOptions) {
    if (value.isZero() || start >= end) {
      return new BN(0);
    }
    if (value.ltn(0)) {
      throw new InvalidFormatError('negative value not supported');
    }

    const neoHolderReward = await this.calculateNeoHolderReward(storages, value, start, end);
    if (vote === undefined) {
      return neoHolderReward;
    }

    const border = this.createStorageKey(this.prefixes.voterRewardPerCommittee).addBuffer(vote).toSearchPrefix();
    const keyStart = this.createStorageKey(this.prefixes.voterRewardPerCommittee)
      .addBuffer(vote)
      .addUInt32BE(start)
      .toSearchPrefix();
    const startRange = await storages.find$(border, keyStart).pipe(toArray()).toPromise();
    const startItem = startRange.length === 0 ? undefined : startRange[startRange.length - 1].value;
    const startRewardPerNeo = startItem === undefined ? new BN(0) : new BN(startItem.value, 'le');

    const keyEnd = this.createStorageKey(this.prefixes.voterRewardPerCommittee)
      .addBuffer(vote)
      .addUInt32BE(end)
      .toSearchPrefix();
    const endRange = await storages.find$(border, keyEnd).pipe(toArray()).toPromise();
    const endItem = endRange.length === 0 ? undefined : endRange[endRange.length - 1].value;
    const endRewardPerNeo = endItem === undefined ? new BN(0) : new BN(endItem.value, 'le');

    return neoHolderReward.add(value.mul(endRewardPerNeo.sub(startRewardPerNeo)).div(this.totalAmount));
  }

  private async calculateNeoHolderReward(storages: Storages, value: BN, start: number, end: number) {
    let sum = new BN(0);
    const sortedGasRecords = await this.getSortedGasRecords(storages, end);
    // tslint:disable-next-line: no-loop-statement
    for (const { index, gasPerBlock } of sortedGasRecords) {
      if (index > start) {
        sum = sum.add(gasPerBlock.muln(end - index));
      } else {
        sum = sum.add(gasPerBlock.muln(end - index));
        break;
      }
    }

    return value.mul(sum).muln(this.ratios.neoHolderReward).divn(100).div(this.totalAmount);
  }

  private async getSortedGasRecords(storages: Storages, end: number): Promise<readonly GasRecord[]> {
    const prefix = this.createStorageKey(this.prefixes.gasPerBlock).addUInt32BE(end).toSearchPrefix();
    const boundary = this.createStorageKey(this.prefixes.gasPerBlock).toSearchPrefix();
    const range = await storages.find$(prefix, boundary).pipe(toArray()).toPromise();

    return range
      .map(({ key, value }) => ({
        index: key.key.readUInt32BE(4),
        gasPerBlock: new BN(value.value, 'le'),
      }))
      .reverse();
  }

  private async computeCommitteeMembers({ storages }: NativeContractStorageContext): Promise<readonly Candidate[]> {
    const item = await storages.get(this.createStorageKey(this.prefixes.votersCount).toStorageKey());
    const votersCount = new BN(item.value).toNumber();
    const voterTurnout = votersCount / this.totalAmount.toNumber();
    const candidates = await this.getCandidates({ storages });

    if (voterTurnout < this.effectiveVoterTurnout || candidates.length < this.settings.committeeMembersCount) {
      return this.settings.standbyCommittee.map((member) => ({
        publicKey: member,
        votes: candidates.find((candidate) => candidate.publicKey.equals(member))?.votes ?? new BN(0),
      }));
    }

    return _.take(candidates.slice().sort(candidateSort), this.settings.committeeMembersCount);
  }
}
