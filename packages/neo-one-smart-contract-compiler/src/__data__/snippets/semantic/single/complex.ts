import {
  Address,
  Blockchain,
  Contract,
  createEventNotifier,
  Fixed,
  Hash256,
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

    // Outputs represent the destination addresses and amounts for native assets
    // A reference is a corresponding output for the inputs of the transaction
    // Now we want to use notifications to check if transfers were sent to this contract
    // const { notifications, sender } = Blockchain.currentTransaction;

    // // Here we're getting the amount of NEO sent to the contract
    // let amount = 0;
    // // tslint:disable-next-line no-loop-statement
    // for (const notification of notifications) {
    //   // Every notification we check that the transferTo address is to this contract
    //   if (notification.state[1].equals(this.address)) {
    //     // Only distribute for NEO received
    //     if (notification.scriptHash.equals(Hash256.NEO)) {
    //       amount += notification[2] * this.amountPerNEO;
    //     }
    //   }
    // }

    // if (amount > this.remaining) {
    //   notifyRefund();

    //   throw new Error('Invalid mintTokens');
    // }

    // this.balances.set(sender, this.balanceOf(sender) + amount);
    // this.mutableRemaining -= amount;
    // this.mutableSupply += amount;
    // notifyTransfer(undefined, sender, amount);
  }

  private hasStarted(): boolean {
    return Blockchain.currentBlockTime >= this.startTimeSeconds;
  }

  private hasEnded(): boolean {
    return Blockchain.currentBlockTime > this.startTimeSeconds + this.icoDurationSeconds;
  }
}
