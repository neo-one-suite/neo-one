import {
  Address,
  Blockchain,
  constant,
  Contract,
  createEventNotifier,
  Deploy,
  Fixed,
  ForwardValue,
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
const notifyApproveSendTransfer = createEventNotifier<Address, Address, Fixed<8>>(
  'approveSendTransfer',
  'from',
  'to',
  'amount',
);
const notifyRevokeSendTransfer = createEventNotifier<Address, Address, Fixed<8>>(
  'revokeSendTransfer',
  'from',
  'to',
  'amount',
);

interface TokenPayableContract {
  readonly approveReceiveTransfer: (
    from: Address,
    amount: Fixed<8>,
    asset: Address,
    // tslint:disable-next-line readonly-array
    ...args: ForwardValue[]
  ) => boolean;
  readonly onRevokeSendTransfer: (from: Address, amount: Fixed<8>, asset: Address) => void;
}

// tslint:disable-next-line export-name
export class One extends SmartContract {
  public readonly properties = {
    trusts: '*',
    groups: [],
    permissions: [],
  };
  public readonly name = 'One';
  public readonly symbol = 'ONE';
  public readonly decimals = 8;
  public readonly amountPerNEO = 100_000;
  private readonly balances = MapStorage.for<Address, Fixed<8>>();
  // tslint:disable-next-line: readonly-array
  private readonly approvedTransfers = MapStorage.for<[Address, Address], Fixed<8>>();
  private mutableRemaining: Fixed<8> = 10_000_000_000_00000000;
  private mutableSupply: Fixed<8> = 0;

  public constructor(
    public readonly owner: Address = Deploy.senderAddress,
    public readonly icoStartTimeSeconds: Integer = Blockchain.currentBlockTime + 60 * 60,
    public readonly icoDurationSeconds: Integer = 86400,
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

  @constant
  public approvedTransfer(from: Address, to: Address): Fixed<8> {
    const approved = this.approvedTransfers.get([from, to]);

    return approved === undefined ? 0 : approved;
  }

  // tslint:disable-next-line readonly-array
  public transfer(from: Address, to: Address, amount: Fixed<8>, ...approveArgs: ForwardValue[]): boolean {
    if (amount < 0) {
      throw new Error(`Amount must be greater than 0: ${amount}`);
    }

    const fromBalance = this.balanceOf(from);
    if (fromBalance < amount) {
      return false;
    }

    const approved = this.approvedTransfer(from, to);
    const reduceApproved = approved >= amount && Address.isCaller(to);
    if (!reduceApproved && !Address.isCaller(from)) {
      return false;
    }

    const contract = Contract.for(to);
    if (contract !== undefined && !Address.isCaller(to)) {
      const smartContract = SmartContract.for<TokenPayableContract>(to);
      if (!smartContract.approveReceiveTransfer(from, amount, this.address, ...approveArgs)) {
        return false;
      }
    }

    const toBalance = this.balanceOf(to);
    this.balances.set(from, fromBalance - amount);
    this.balances.set(to, toBalance + amount);
    notifyTransfer(from, to, amount);

    if (reduceApproved) {
      this.approvedTransfers.set([from, to], approved - amount);
    }

    return true;
  }

  public approveSendTransfer(from: Address, to: Address, amount: Fixed<8>): boolean {
    if (amount < 0) {
      throw new Error(`Amount must be greater than 0: ${amount}`);
    }

    if (!Address.isCaller(from)) {
      return false;
    }

    this.approvedTransfers.set([from, to], this.approvedTransfer(from, to) + amount);
    notifyApproveSendTransfer(from, to, amount);

    return true;
  }

  public approveReceiveTransfer(_from: Address, _amount: Fixed<8>, _asset: Address): boolean {
    return false;
  }

  public revokeSendTransfer(from: Address, to: Address, amount: Fixed<8>): boolean {
    if (amount < 0) {
      throw new Error(`Amount must be greater than 0: ${amount}`);
    }

    if (!Address.isCaller(from)) {
      return false;
    }

    const approved = this.approvedTransfer(from, to);
    if (approved < amount) {
      return false;
    }

    this.approvedTransfers.set([from, to], approved - amount);
    notifyRevokeSendTransfer(from, to, amount);

    const contract = Contract.for(to);
    if (contract !== undefined) {
      const smartContract = SmartContract.for<TokenPayableContract>(to);
      // NOTE: This should catch errors once we have stack isolation
      smartContract.onRevokeSendTransfer(from, amount, this.address);
    }

    return true;
  }

  public onRevokeSendTransfer(_from: Address, _amount: Fixed<8>, _asset: Address): void {
    // do nothing
  }

  @constant
  public get remaining(): Fixed<8> {
    return this.mutableRemaining;
  }

  @receive
  public mintTokens(): void {
    if (!this.hasStarted() || this.hasEnded()) {
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
    //   throw new Error('Invalid mintTokens');
    // }

    // this.mutableRemaining -= amount;
    // this.issue(sender, amount);
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
