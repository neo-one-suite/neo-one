import { Address, Blockchain, constant, Fixed, Integer, receive, SmartContract } from '@neo-one/smart-contract';

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

      const transfers = Blockchain.currentNEOTransfers.filter(
        (transfer) => transfer.to !== undefined && transfer.to.equals(this.address),
      );
      if (transfers.length === 0) {
        throw new Error('Invalid mintTokens');
      }

      const sender = Blockchain.currentTransaction.sender;
      let amount = 0;
      // tslint:disable-next-line: no-loop-statement
      for (const transfer of transfers) {
        if (transfer.from !== undefined && transfer.from.equals(sender)) {
          amount += transfer.amount * this.amountPerNEO;
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
