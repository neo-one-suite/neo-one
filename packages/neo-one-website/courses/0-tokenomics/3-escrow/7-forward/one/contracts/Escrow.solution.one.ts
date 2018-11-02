import {
  Address,
  Blockchain,
  constant,
  createEventNotifier,
  declareEvent,
  Fixed,
  ForwardedValue,
  MapStorage,
  SmartContract,
} from '@neo-one/smart-contract';

const notifyBalanceAvailable = createEventNotifier<Address, Address, Fixed<8>, Address>(
  'balanceAvailable',
  'from',
  'to',
  'amount',
  'asset',
);
const notifyBalanceClaimed = createEventNotifier<Address, Address, Fixed<8>, Address>(
  'balanceClaimed',
  'from',
  'to',
  'amount',
  'asset',
);
const notifyBalanceRefunded = createEventNotifier<Address, Address, Fixed<8>, Address>(
  'balanceRefunded',
  'from',
  'to',
  'amount',
  'asset',
);

interface Token {
  readonly transfer: (from: Address, to: Address, amount: Fixed<8>) => boolean;
}
declareEvent<Address | undefined, Address | undefined, Fixed<8>>('transfer', 'from', 'to', 'amount');

export class Escrow extends SmartContract {
  private readonly balances = MapStorage.for<[Address, Address, Address], Fixed<8>>();

  @constant
  public balanceOf(from: Address, to: Address, asset: Address): Fixed<8> {
    const balance = this.balances.get([from, to, asset]);

    return balance === undefined ? 0 : balance;
  }

  public approveReceiveTransfer(from: Address, amount: Fixed<8>, to: ForwardedValue<Address>): boolean {
    const asset = Blockchain.currentCallerContract;
    if (asset === undefined) {
      return false;
    }

    this.setBalance(from, to, this.balanceOf(from, to, asset) + amount, asset);
    notifyBalanceAvailable(from, to, amount, asset);

    return true;
  }

  public deposit(from: Address, to: Address, amount: Fixed<8>, asset: Address): boolean {
    if (!Address.isCaller(from)) {
      return false;
    }

    const token = SmartContract.for<Token>(asset);
    if (token.transfer(from, this.address, amount)) {
      this.setBalance(from, to, this.balanceOf(from, to, asset) + amount, asset);
      notifyBalanceAvailable(from, to, amount, asset);

      return true;
    }

    return false;
  }

  public claim(from: Address, to: Address, amount: Fixed<8>, asset: Address): boolean {
    if (amount < 0) {
      throw new Error(`Amount must be greater than 0: ${amount}`);
    }

    if (!Address.isCaller(to)) {
      return false;
    }

    const available = this.balanceOf(from, to, asset);
    if (available < amount) {
      return false;
    }

    const token = SmartContract.for<Token>(asset);
    if (token.transfer(this.address, to, amount)) {
      this.setBalance(from, to, available - amount, asset);
      notifyBalanceClaimed(from, to, amount, asset);

      return true;
    }

    return false;
  }

  public refund(from: Address, to: Address, amount: Fixed<8>, asset: Address): boolean {
    if (amount < 0) {
      throw new Error(`Amount must be greater than 0: ${amount}`);
    }

    if (!Address.isCaller(from)) {
      return false;
    }

    const available = this.balanceOf(from, to, asset);
    if (available < amount) {
      return false;
    }

    const token = SmartContract.for<Token>(asset);
    if (token.transfer(this.address, from, amount)) {
      this.setBalance(from, to, available - amount, asset);
      notifyBalanceRefunded(from, to, amount, asset);

      return true;
    }

    return false;
  }

  private setBalance(from: Address, to: Address, amount: Fixed<8>, asset: Address): void {
    this.balances.set([from, to, asset], amount);
  }
}
