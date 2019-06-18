import {
  Address,
  Blockchain,
  constant,
  Fixed,
  Hash256,
  Integer,
  receive,
  SmartContract,
} from '@neo-one/smart-contract';

export function ICO<TBase extends Constructor<SmartContract>>(Base: TBase) {
  abstract class ICOClass extends Base {
    public abstract readonly icoStartTimeSeconds: Integer;
    public abstract readonly icoDurationSeconds: Integer;
    public abstract readonly amountPerNEO: Fixed<8>;
    private mutableRemaining: Fixed<8> = this.getICOAmount();

    @constant
    public get remaining(): number {
      return this.mutableRemaining;
    }

    @receive
    public mintTokens(): void {
      if (!this.hasStarted() || this.hasEnded()) {
        throw new Error('Invalid mintTokens');
      }

      const { references } = Blockchain.currentTransaction;
      if (references.length === 0) {
        throw new Error('Invalid mintTokens');
      }
      const sender = references[0].address;

      let amount = 0;
      // tslint:disable-next-line no-loop-statement
      for (const output of Blockchain.currentTransaction.outputs) {
        if (output.address.equals(this.address)) {
          if (!output.asset.equals(Hash256.NEO)) {
            throw new Error('Invalid mintTokens');
          }

          amount += output.value * this.amountPerNEO;
        }
      }

      if (amount > this.remaining) {
        throw new Error('Invalid mintTokens');
      }

      this.mutableRemaining -= amount;
      this.issue(sender, amount);
    }

    public abstract getICOAmount(): Fixed<8>;
    protected abstract issue(addr: Address, amount: Fixed<8>): void;

    private hasStarted(): boolean {
      return Blockchain.currentBlockTime >= this.icoStartTimeSeconds;
    }

    private hasEnded(): boolean {
      return Blockchain.currentBlockTime > this.icoStartTimeSeconds + this.icoDurationSeconds;
    }
  }

  return ICOClass;
}
