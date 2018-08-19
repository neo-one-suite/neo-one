import {
  Address,
  Blockchain,
  constant,
  createEventNotifier,
  Fixed,
  Hash256,
  Integer,
  LinkedSmartContract,
  SmartContract,
  verify,
} from '@neo-one/smart-contract';
import { Token } from './Token';

const notifyRefund = createEventNotifier('refund');

export class ICO implements SmartContract {
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'NEO•ONE ICO',
    payable: true,
  };
  public readonly amountPerNEO = 10;
  private mutableRemaining: Fixed<8> = 10_000_000_000_00000000;

  public constructor(
    public readonly owner: Address = Address.from('AXNajBTQLxWHwc9sKyXcc4UdbJvp3arYDG'),
    public readonly startTimeSeconds: Integer = 1534108415,
    public readonly icoDurationSeconds: Integer = 157700000,
  ) {
    if (!Address.verifySender(owner)) {
      throw new Error('Sender was not the owner.');
    }
  }

  @constant
  public get remaining(): Fixed<8> {
    return this.mutableRemaining;
  }

  @verify
  public mintTokens(): boolean {
    if (!this.hasStarted() || this.hasEnded()) {
      notifyRefund();

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
      if (output.address.equals(Blockchain.contractAddress)) {
        if (!output.asset.equals(Hash256.NEO)) {
          notifyRefund();

          return false;
        }

        amount += output.value * this.amountPerNEO;
      }
    }

    if (amount > this.remaining) {
      notifyRefund();

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

    notifyRefund();

    return false;
  }

  private hasStarted(): boolean {
    return Blockchain.currentBlockTime >= this.startTimeSeconds;
  }

  private hasEnded(): boolean {
    return Blockchain.currentBlockTime > this.startTimeSeconds + this.icoDurationSeconds;
  }
}
