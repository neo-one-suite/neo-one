import {
  Address,
  constant,
  createEventNotifier,
  declareEvent,
  Fixed,
  ForwardedValue,
  MapStorage,
  SmartContract,
} from '@neo-one/smart-contract';

interface Token {
  readonly transfer: (from: Address, to: Address, amount: Fixed<8>) => boolean;
}

const notifyBalanceAvailable = createEventNotifier<Address, Address, Address, Fixed<8>>(
  'balanceAvailable',
  'from',
  'to',
  'asset',
  'amount',
);

const notifyBalanceClaimed = createEventNotifier<Address, Address, Address, Fixed<8>>(
  'balanceClaimed',
  'from',
  'to',
  'asset',
  'amount',
);

const notifyBalanceRefunded = createEventNotifier<Address, Address, Address, Fixed<8>>(
  'balanceRefunded',
  'from',
  'to',
  'asset',
  'amount',
);

declareEvent<Address | undefined, Address | undefined, Fixed<8>>('transfer', 'from', 'to', 'amount');

export class Escrow extends SmartContract {
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'Escrow',
  };
  private readonly balances = MapStorage.for<[Address, Address, Address], Fixed<8>>();

  @constant
  public balanceOf(from: Address, to: Address, asset: Address): Fixed<8> {
    const balance = this.balances.get([to, asset, from]);

    return balance === undefined ? 0 : balance;
  }

  public approveReceiveTransfer(from: Address, amount: Fixed<8>, asset: Address, to: ForwardedValue<Address>): boolean {
    if (!Address.isCaller(asset)) {
      return false;
    }

    this.setBalance(from, to, asset, this.balanceOf(from, to, asset) + amount);
    notifyBalanceAvailable(from, to, asset, amount);

    return true;
  }

  public onRevokeSendTransfer(_from: Address, _amount: Fixed<0>, _asset: Address): void {
    // do nothing
  }

  public claim(from: Address, to: Address, asset: Address, amount: Fixed<8>): boolean {
    if (!Address.isCaller(to)) {
      return false;
    }

    const contract = SmartContract.for<Token>(asset);
    if (contract.transfer(this.address, to, amount)) {
      this.setBalance(from, to, asset, this.balanceOf(from, to, asset) - amount);
      notifyBalanceClaimed(from, to, asset, amount);

      return true;
    }

    return false;
  }

  public refund(from: Address, to: Address, asset: Address, amount: Fixed<8>): boolean {
    if (!Address.isCaller(from)) {
      return false;
    }

    const contract = SmartContract.for<Token>(asset);
    if (contract.transfer(this.address, from, amount)) {
      this.setBalance(from, to, asset, this.balanceOf(from, to, asset) - amount);
      notifyBalanceRefunded(from, to, asset, amount);

      return true;
    }

    return false;
  }

  private setBalance(from: Address, to: Address, asset: Address, amount: Fixed<8>): void {
    this.balances.set([to, asset, from], amount);
  }
}
