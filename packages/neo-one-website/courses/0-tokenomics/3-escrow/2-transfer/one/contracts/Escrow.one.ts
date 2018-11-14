import { Address, constant, createEventNotifier, Fixed, MapStorage, SmartContract } from '@neo-one/smart-contract';

const notifyBalanceAvailable = createEventNotifier<Address, Address, Fixed<8>>(
  'balanceAvailable',
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

    this.setBalance(from, to, this.balanceOf(from, to) + amount);
    notifyBalanceAvailable(from, to, amount);

    return true;
  }

  private setBalance(from: Address, to: Address, amount: Fixed<8>): void {
    this.balances.set([from, to], amount);
  }
}
