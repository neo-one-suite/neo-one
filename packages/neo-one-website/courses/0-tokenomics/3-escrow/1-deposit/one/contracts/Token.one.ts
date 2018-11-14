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
  sendUnsafe,
  SmartContract,
} from '@neo-one/smart-contract';

const notifyTransfer = createEventNotifier<Address | undefined, Address | undefined, Fixed<8>>(
  'transfer',
  'from',
  'to',
  'amount',
);
const notifyApproveSendTransfer = createEventNotifier<Address, Address, Fixed<8>>(
  'approveSendTransfer',
  'from',
  'by',
  'amount',
);
const notifyRevokeSendTransfer = createEventNotifier<Address, Address, Fixed<8>>(
  'revokeSendTransfer',
  'from',
  'by',
  'amount',
);

export class Token extends SmartContract {
  public readonly name = 'Eon';
  public readonly symbol = 'EON';
  public readonly decimals = 8;
  public readonly amountPerNEO = 100_000;
  private readonly balances = MapStorage.for<Address, Fixed<8>>();
  private readonly approvedTransfers = MapStorage.for<[Address, Address], Fixed<8>>();
  private mutableRemaining: Fixed<8> = 10_000_000_000_00000000;
  private mutableSupply: Fixed<8> = 0;

  public constructor(
    public readonly owner: Address = Deploy.senderAddress,
    public readonly icoStartTimeSeconds = Blockchain.currentBlockTime + 60 * 60,
    public readonly icoDurationSeconds = 86400,
  ) {
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

  @constant
  public approvedTransfer(from: Address, by: Address | undefined): Fixed<8> {
    if (by === undefined) {
      return 0;
    }

    const approved = this.approvedTransfers.get([from, by]);

    return approved === undefined ? 0 : approved;
  }

  public approveSendTransfer(from: Address, by: Address, amount: Fixed<8>): boolean {
    if (amount < 0) {
      throw new Error(`Amount must be greater than 0: ${amount}`);
    }

    if (!Address.isCaller(from)) {
      return false;
    }

    this.approvedTransfers.set([from, by], this.approvedTransfer(from, by) + amount);
    notifyApproveSendTransfer(from, by, amount);

    return true;
  }

  public revokeSendTransfer(from: Address, by: Address, amount: Fixed<8>): boolean {
    if (amount < 0) {
      throw new Error(`Amount must be greater than 0: ${amount}`);
    }

    if (!Address.isCaller(from)) {
      return false;
    }

    const approved = this.approvedTransfer(from, by);
    if (approved < amount) {
      return false;
    }

    this.approvedTransfers.set([from, by], approved - amount);
    notifyRevokeSendTransfer(from, by, amount);

    return true;
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

    const { references, outputs } = Blockchain.currentTransaction;
    if (references.length === 0) {
      return false;
    }
    const sender = references[0].address;

    let amount = 0;
    // tslint:disable-next-line no-loop-statement
    for (const output of outputs) {
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

    this.mutableRemaining -= amount;
    this.issue(sender, amount);

    return true;
  }

  @sendUnsafe
  public withdraw(): boolean {
    return Address.isCaller(this.owner);
  }

  private issue(addr: Address, amount: Fixed<8>): void {
    this.balances.set(addr, this.balanceOf(addr) + amount);
    this.mutableSupply += amount;
    notifyTransfer(undefined, addr, amount);
  }

  private hasStarted(): boolean {
    return Blockchain.currentBlockTime >= this.icoStartTimeSeconds;
  }

  private hasEnded(): boolean {
    return Blockchain.currentBlockTime > this.icoStartTimeSeconds + this.icoDurationSeconds;
  }
}
