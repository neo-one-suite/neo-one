import {
  Address,
  constant,
  Contract,
  createEventNotifier,
  Fixed,
  MapStorage,
  SmartContract,
} from '@neo-one/smart-contract';

const notifyTransfer = createEventNotifier<Address | undefined, Address | undefined, Fixed<8>>(
  'transfer',
  'from',
  'to',
  'amount',
);

export class Token extends SmartContract {
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'NEO•ONE Token',
  };
  public readonly name = 'One';
  public readonly symbol = 'ONE';
  public readonly decimals = 8;
  private mutableSupply: Fixed<8> = 0;
  private readonly balances = MapStorage.for<Address, Fixed<8>>();

  @constant
  public get totalSupply(): Fixed<8> {
    return this.mutableSupply;
  }

  @constant
  public balanceOf(address: Address): Fixed<8> {
    const balance = this.balances.get(address);

    return balance === undefined ? 0 : balance;
  }

  public transfer(from: Address, to: Address, amount: Fixed<8>): boolean {
    if (amount < 0) {
      throw new Error(`Amount must be greater than 0: ${amount}`);
    }

    if (!Address.isCaller(from)) {
      return false;
    }

    const contract = Contract.for(to);
    if (contract !== undefined && !contract.payable) {
      return false;
    }

    const fromBalance = this.balanceOf(from);
    if (fromBalance < amount) {
      return false;
    }

    const toBalance = this.balanceOf(to);
    this.balances.set(from, fromBalance - amount);
    this.balances.set(to, toBalance + amount);
    notifyTransfer(from, to, amount);

    return true;
  }

  public issue(to: Address, amount: Fixed<8>): boolean {
    if (amount < 0) {
      throw new Error(`Amount must be greater than 0: ${amount}`);
    }

    const toBalance = this.balanceOf(to);
    this.balances.set(to, toBalance + amount);
    notifyTransfer(undefined, to, amount);
    this.mutableSupply += amount;

    return true;
  }
}
