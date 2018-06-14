// tslint:disable readonly-keyword readonly-array no-object-mutation strict-boolean-expressions
import {
  Address,
  constant,
  createEventHandler,
  Fixed,
  getAsset,
  getCurrentTime,
  getCurrentTransaction,
  Hash256,
  Integer,
  MapStorage,
  SetStorage,
  verify,
  verifySender,
} from '@neo-one/smart-contract';

import { Token } from './Token';

const onRefund = createEventHandler('refund');

export abstract class ICO<Decimals extends number> extends Token<Decimals> {
  public abstract readonly icoAmount: Fixed<Decimals>;
  public abstract readonly maxLimitedRoundAmount: Fixed<Decimals>;
  private readonly kyc: SetStorage<Address> = new SetStorage();
  private readonly tokensPerAssetLimitedRound: MapStorage<Hash256, Fixed<Decimals>> = new MapStorage();
  private readonly tokensPerAsset: MapStorage<Hash256, Fixed<Decimals>> = new MapStorage();
  private readonly limitedRoundRemaining: MapStorage<Address, Fixed<Decimals>> = new MapStorage();
  private icoRemaining: Fixed<Decimals> = this.icoAmount;

  public constructor(
    owner: Address,
    public readonly startTimeSeconds: Integer,
    public readonly limitedRoundDurationSeconds: Integer,
    public readonly icoDurationSeconds: Integer,
    public readonly preICOAmount: Fixed<Decimals>,
  ) {
    super(owner);
    this.issue(owner, preICOAmount);
  }

  @verify
  public mintTokens(): void {
    if (!this.hasStarted()) {
      onRefund();
      throw new Error('Crowdsale has not started');
    }
    if (this.hasEnded()) {
      onRefund();
      throw new Error('Crowdsale has ended');
    }

    const { references } = getCurrentTransaction();
    if (references.length === 0) {
      return;
    }

    const sender = references[0].address;
    if (!this.canParticipate(sender)) {
      onRefund();
      throw new Error('Address has not been whitelised');
    }
    const amount = getCurrentTransaction()
      .outputs.filter((output) => output.address.equals(this.address))
      .reduce((acc, output) => {
        const amountPerAsset = this.isLimitedRound()
          ? this.tokensPerAssetLimitedRound.get(output.asset)
          : this.tokensPerAsset.get(output.asset);
        if (amountPerAsset === null) {
          onRefund();
          throw new Error(`Asset ${output.asset} is not accepted for the crowdsale`);
        }
        const asset = getAsset(output.asset);
        const normalizedValue = output.value / 10 ** (8 - asset.precision);

        return acc + normalizedValue * amountPerAsset;
      }, 0);

    if (amount > this.icoRemaining) {
      onRefund();
      throw new Error('Amount is greater than remaining ICO tokens');
    }

    if (this.isLimitedRound()) {
      const remaining = this.getRemainingLimitedRound(sender);
      if (amount > remaining) {
        onRefund();
        throw new Error('Limited round maximum contribution reached.');
      }
      this.limitedRoundRemaining.set(sender, remaining - amount);
    }

    this.issue(sender, amount);
    this.icoRemaining -= amount;
  }

  public setExchange(asset: Hash256, tokens: Fixed<Decimals>): void {
    verifySender(this.owner);
    if (this.hasStarted()) {
      throw new Error('Cannot change token amount once crowdsale has started');
    }
    this.tokensPerAsset.set(asset, tokens);
  }

  public getExchangeRate(asset: Hash256): Fixed<Decimals> {
    return this.tokensPerAsset.get(asset) || 0;
  }

  public setLimitedRoundExchange(asset: Hash256, tokens: Fixed<Decimals>): void {
    verifySender(this.owner);
    if (this.hasStarted()) {
      throw new Error('Cannot change token amount once crowdsale has started');
    }
    this.tokensPerAssetLimitedRound.set(asset, tokens);
  }

  @constant
  public getLimitedRoundExchangeRate(asset: Hash256): Fixed<Decimals> {
    return this.tokensPerAssetLimitedRound.get(asset) || 0;
  }

  @constant
  public getRemainingLimitedRound(address: Address): Fixed<Decimals> {
    const remaining = this.limitedRoundRemaining.get(address);

    return remaining === null ? this.maxLimitedRoundAmount : remaining;
  }

  public endICO(): void {
    verifySender(this.owner);
    if (this.icoRemaining > 0) {
      if (!this.hasEnded()) {
        throw new Error('ICO has not ended.');
      }

      this.icoRemaining = 0;
      this.issue(this.owner, this.icoRemaining);
    }
  }

  public register(addresses: Address[]): void {
    verifySender(this.owner);
    addresses.forEach((addr) => {
      if (!this.kyc.has(addr)) {
        this.kyc.add(addr);
      }
    });
  }

  @constant
  public canParticipate(addr: Address): boolean {
    return this.kyc.has(addr);
  }

  private hasStarted(): boolean {
    return getCurrentTime() >= this.startTimeSeconds;
  }

  private hasEnded(): boolean {
    return getCurrentTime() > this.startTimeSeconds + this.icoDurationSeconds;
  }

  private isLimitedRound(): boolean {
    return this.hasStarted() && getCurrentTime() < this.startTimeSeconds + this.limitedRoundDurationSeconds;
  }
}
