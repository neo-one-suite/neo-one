import {
  Address,
  Blockchain,
  Contract,
  createEventNotifier,
  Fixed,
  Integer,
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

const notifyTransfer2 = createEventNotifier<Address, Address, Fixed<8>>('transfer', 'from', 'to', 'amount');

const notifyRefund = createEventNotifier('refund');

// tslint:disable-next-line export-name
export class ICO extends SmartContract {
  public readonly properties = {
    trusts: '*',
    groups: [],
    permissions: [],
  };
  public readonly name = 'One';
  public readonly symbol = 'ONE';
  public readonly decimals = 8;
  public readonly amountPerNEO = 10;
  private mutableRemaining: Fixed<8> = 10_000_000_000_00000000;
  private mutableSupply: Fixed<8> = 0;
  private readonly balances = MapStorage.for<Address, Fixed<8>>();

  public constructor(
    public readonly owner: Address = Address.from('abc'),
    public readonly startTimeSeconds: Integer = 1000000,
    public readonly icoDurationSeconds: Integer = 100000,
  ) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
  }

  public get totalSupply(): Fixed<8> {
    return this.mutableSupply;
  }

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
    if (contract !== undefined) {
      return false;
    }

    const fromBalance = this.balanceOf(from);
    if (fromBalance < amount) {
      return false;
    }

    const toBalance = this.balanceOf(to);
    this.balances.set(from, fromBalance - amount);
    this.balances.set(to, toBalance + amount);
    notifyTransfer2(from, to, amount);

    return true;
  }

  public get remaining(): number {
    return this.mutableRemaining;
  }

  @receive
  public mintTokens(): void {
    if (!this.hasStarted() || this.hasEnded()) {
      notifyRefund();

      throw new Error('Invalid mintTokens');
    }

    // Get the valid transfers of NEO that have been sent to this contract
    const transfers = Blockchain.currentNEOTransfers.filter(
      (transfer) => transfer.to !== undefined && transfer.to.equals(this.address),
    );

    // If there are no valid NEO transfers to this contract then throw.
    if (transfers.length === 0) {
      throw new Error('Invalid mintTokens');
    }

    // Get the current caller of the contract from the current transaction.
    const caller = Blockchain.currentTransaction.sender;
    let amount = 0;
    // tslint:disable-next-line: no-loop-statement
    for (const transfer of transfers) {
      // Add up all the transfers that have come from the contract caller.
      if (transfer.from !== undefined && transfer.from.equals(caller)) {
        amount += transfer.amount * this.amountPerNEO;
      }
    }

    if (amount > this.remaining) {
      notifyRefund();

      throw new Error('Invalid mintTokens');
    }

    this.balances.set(caller, this.balanceOf(caller) + amount);
    this.mutableRemaining -= amount;
    this.mutableSupply += amount;
    notifyTransfer(undefined, caller, amount);
  }

  private hasStarted(): boolean {
    return Blockchain.currentBlockTime >= this.startTimeSeconds;
  }

  private hasEnded(): boolean {
    return Blockchain.currentBlockTime > this.startTimeSeconds + this.icoDurationSeconds;
  }
}
