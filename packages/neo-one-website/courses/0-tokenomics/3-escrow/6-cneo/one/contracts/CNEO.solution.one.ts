import {
  Address,
  Blockchain,
  claim,
  constant,
  createEventNotifier,
  Deploy,
  Fixed,
  Hash256,
  MapStorage,
  receive,
  send,
  SmartContract,
  Transfer,
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

export class CNEO extends SmartContract {
  public readonly name = 'CNEO';
  public readonly symbol = 'CNEO';
  public readonly decimals = 8;
  private readonly balances = MapStorage.for<Address, Fixed<8>>();
  private readonly approvedTransfers = MapStorage.for<[Address, Address], Fixed<8>>();
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

    const by = Blockchain.currentCallerContract;
    const approvedAmount = this.approvedTransfer(from, by);
    const reduceApproved = approvedAmount >= amount;
    if (!reduceApproved && !Address.isCaller(from)) {
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

    if (by !== undefined && reduceApproved) {
      this.approvedTransfers.set([from, by], approvedAmount - amount);
    }

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

  @receive
  public wrap(): boolean {
    const transaction = Blockchain.currentTransaction;
    const { references } = transaction;
    if (references.length === 0) {
      // Nothing to refund
      return false;
    }

    // We're only going to credit one address, so just pick the first one from the references.
    const sender = references[0].address;
    // We loop over the entire reference list, so users will want to consolidate prior to invoking.
    if (references.some((reference) => reference.asset.equals(Hash256.NEO) && !reference.address.equals(sender))) {
      return false;
    }

    let amount = 0;
    // tslint:disable-next-line no-loop-statement
    for (const output of transaction.outputs) {
      if (output.address.equals(this.address)) {
        // Don't allow transactions that send anything but NEO to the contract.
        if (!output.asset.equals(Hash256.NEO)) {
          return false;
        }

        amount += output.value;
      }
    }

    if (amount === 0) {
      return false;
    }

    this.balances.set(sender, this.balanceOf(sender) + amount);
    this.mutableSupply += amount;
    notifyTransfer(undefined, sender, amount);

    return true;
  }

  @send
  public unwrap(transfer: Transfer): boolean {
    if (!transfer.asset.equals(Hash256.NEO)) {
      return false;
    }

    const balance = this.balanceOf(transfer.to);
    if (balance < transfer.amount) {
      return false;
    }

    this.balances.set(transfer.to, balance - transfer.amount);
    this.mutableSupply -= transfer.amount;
    notifyTransfer(transfer.to, undefined, transfer.amount);

    return true;
  }

  @claim
  public claim(): boolean {
    return Address.isCaller(this.owner);
  }
}
