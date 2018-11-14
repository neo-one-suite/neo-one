import {
  Address,
  constant,
  createEventNotifier,
  Fixed,
  LinkedSmartContract,
  MapStorage,
  SmartContract,
} from '@neo-one/smart-contract';
import { Token } from './Token.one';

const notifyBalanceAvailable = createEventNotifier<Address, Address, Fixed<8>>(
  'balanceAvailable',
  'from',
  'to',
  'amount',
);
const notifyBalanceClaimed = createEventNotifier<Address, Address, Fixed<8>>('balanceClaimed', 'from', 'to', 'amount');
const notifyBalanceRefunded = createEventNotifier<Address, Address, Fixed<8>>(
  'balanceRefunded',
  'from',
  'to',
  'amount',
);

export class Escrow extends SmartContract {
  private readonly balances = MapStorage.for<[Address, Address], Fixed<8>>();

  @constant
  public balanceOf(from: Address, to: Address): Fixed<8> {
    const balance = this.balances.get([from, to]);

    return balance === undefined ? 0 : balance;
  }

  public deposit(from: Address, to: Address, amount: Fixed<8>): boolean {
    if (!Address.isCaller(from)) {
      return false;
    }

    const token = LinkedSmartContract.for<Token>();
    if (token.transfer(from, this.address, amount)) {
      this.setBalance(from, to, this.balanceOf(from, to) + amount);
      notifyBalanceAvailable(from, to, amount);

      return true;
    }

    return false;
  }

  public claim(from: Address, to: Address, amount: Fixed<8>): boolean {
    if (amount < 0) {
      throw new Error(`Amount must be greater than 0: ${amount}`);
    }

    if (!Address.isCaller(to)) {
      return false;
    }

    const available = this.balanceOf(from, to);
    if (available < amount) {
      return false;
    }

    const token = LinkedSmartContract.for<Token>();
    if (token.transfer(this.address, to, amount)) {
      this.setBalance(from, to, available - amount);
      notifyBalanceClaimed(from, to, amount);

      return true;
    }

    return false;
  }

  public refund(from: Address, to: Address, amount: Fixed<8>): boolean {
    if (amount < 0) {
      throw new Error(`Amount must be greater than 0: ${amount}`);
    }

    if (!Address.isCaller(from)) {
      return false;
    }

    const available = this.balanceOf(from, to);
    if (available < amount) {
      return false;
    }

    const token = LinkedSmartContract.for<Token>();
    if (token.transfer(this.address, from, amount)) {
      this.setBalance(from, to, available - amount);
      notifyBalanceRefunded(from, to, amount);

      return true;
    }

    return false;
  }

  private setBalance(from: Address, to: Address, amount: Fixed<8>): void {
    this.balances.set([from, to], amount);
  }
}
