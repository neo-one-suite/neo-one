import {
  Address,
  Blockchain,
  constant,
  Deploy,
  Fixed,
  Hash256,
  Integer,
  LinkedSmartContract,
  receive,
  SmartContract,
} from '@neo-one/smart-contract';
import { Token } from './Token';
export class ICO extends SmartContract {
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'NEO•ONE ICO',
  };
  public readonly amountPerNEO = 10;
  private mutableRemaining: Fixed<8> = 10_000_000_000_00000000;
  public constructor(
    public readonly owner: Address = Deploy.senderAddress,
    public readonly startTimeSeconds: Integer = Blockchain.currentBlockTime,
    public readonly icoDurationSeconds: Integer = 157700000,
  ) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
  }
  @constant
  public get remaining(): Fixed<8> {
    return this.mutableRemaining;
  }
  @receive
  public mintTokens(): boolean {
    if (!this.hasStarted() || this.hasEnded()) {
      return false;
    }
    const { references } = Blockchain.currentTransaction;
    if (references.length === 0) {
      return false;
    }
    const sender = references[0].address;
    let amount = 0;
    // tslint:disable-next-line no-loop-statement
    for (const output of Blockchain.currentTransaction.outputs) {
      if (output.address.equals(this.address)) {
        if (!output.asset.equals(Hash256.NEO)) {
          return false;
        }
        amount += output.value * this.amountPerNEO;
      }
    }
    if (amount > this.remaining) {
      return false;
    }
    if (amount === 0) {
      return false;
    }
    const token = LinkedSmartContract.for<Token>();
    if (token.issue(sender, amount)) {
      this.mutableRemaining -= amount;
      return true;
    }
    return false;
  }
  private hasStarted(): boolean {
    return Blockchain.currentBlockTime >= this.startTimeSeconds;
  }
  private hasEnded(): boolean {
    return Blockchain.currentBlockTime > this.startTimeSeconds + this.icoDurationSeconds;
  }
}
