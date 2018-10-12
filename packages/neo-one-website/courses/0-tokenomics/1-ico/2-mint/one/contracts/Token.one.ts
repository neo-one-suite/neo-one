import {
  Address,
  Blockchain,
  constant,
  createEventNotifier,
  Deploy,
  Fixed,
  Hash256,
  MapStorage,
  receive,
  SmartContract,
} from '@neo-one/smart-contract';

const notifyTransfer = createEventNotifier<Address | undefined, Address | undefined, Fixed<8>>(
  'transfer',
  'from',
  'to',
  'amount',
);

export class Token extends SmartContract {
  public readonly name = 'Eon';
  public readonly symbol = 'EON';
  public readonly decimals = 8;
  private readonly balances = MapStorage.for<Address, Fixed<8>>();
  private mutableSupply: Fixed<8> = 0;

  public constructor(public readonly owner: Address = Deploy.senderAddress) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
  }

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

  @receive
  public mintTokens(): boolean {
    const { references, outputs } = Blockchain.currentTransaction;
    if (references.length === 0) {
      return false;
    }

    // tslint:disable-next-line no-loop-statement
    for (const output of outputs) {
      // tslint:disable-next-line no-collapsible-if
      if (output.address.equals(this.address)) {
        if (!output.asset.equals(Hash256.NEO)) {
          return false;
        }
      }
    }

    return true;
  }

  public issue(addr: Address, amount: Fixed<8>): void {
    if (!Address.isCaller(this.owner)) {
      throw new Error('Only the owner can issue tokens.');
    }
    this.balances.set(addr, this.balanceOf(addr) + amount);
    this.mutableSupply += amount;
    notifyTransfer(undefined, addr, amount);
  }
}
