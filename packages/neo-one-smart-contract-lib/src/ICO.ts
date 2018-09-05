import { Blockchain, constant, Fixed, Hash256, Integer, receive } from '@neo-one/smart-contract';

import { Token } from './Token';

export abstract class ICO<Decimals extends number> extends Token<Decimals> {
  private mutableRemaining: Fixed<Decimals>;

  public constructor(
    public readonly icoStartTimeSeconds: Integer,
    public readonly icoDurationSeconds: Integer,
    public readonly icoAmount: Fixed<Decimals>,
    public readonly amountPerNEO: Fixed<Decimals>,
  ) {
    super();
    this.mutableRemaining = icoAmount;
  }

  @constant
  public get remaining(): number {
    return this.mutableRemaining;
  }

  @receive
  public mintTokens(): boolean {
    if (!this.hasStarted() || this.hasEnded()) {
      this.allowedRefunds.add(Blockchain.currentTransaction.hash);

      return false;
    }

    const { references } = Blockchain.currentTransaction;
    if (references.length === 0) {
      this.allowedRefunds.add(Blockchain.currentTransaction.hash);

      return false;
    }
    const sender = references[0].address;

    let amount = 0;
    // tslint:disable-next-line no-loop-statement
    for (const output of Blockchain.currentTransaction.outputs) {
      if (output.address.equals(this.address)) {
        if (!output.asset.equals(Hash256.NEO)) {
          this.allowedRefunds.add(Blockchain.currentTransaction.hash);

          return false;
        }

        amount += output.value * this.amountPerNEO;
      }
    }

    if (amount > this.remaining) {
      this.allowedRefunds.add(Blockchain.currentTransaction.hash);

      return false;
    }

    this.mutableRemaining -= amount;
    this.issue(sender, amount);

    return true;
  }

  private hasStarted(): boolean {
    return Blockchain.currentBlockTime >= this.icoStartTimeSeconds;
  }

  private hasEnded(): boolean {
    return Blockchain.currentBlockTime > this.icoStartTimeSeconds + this.icoDurationSeconds;
  }
}
