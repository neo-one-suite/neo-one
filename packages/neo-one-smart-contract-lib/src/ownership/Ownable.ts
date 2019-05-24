import { Address, createEventNotifier, SmartContract } from '@neo-one/smart-contract';

const notifyTransferOwnership = createEventNotifier<Address, Address>('transfer_ownership', 'from', 'to');

export function Ownable<TBase extends Constructor<SmartContract>>(base: TBase) {
  abstract class OwnableClass extends base {
    protected abstract initialOwner: Address;
    private mutableOwner: Address | undefined = undefined;
    private mutableOwnerInitialized = false;

    public get owner(): Address | undefined {
      return this.mutableOwner !== undefined ? this.mutableOwner : this.initializeOwner();
    }

    public renounceOwnership() {
      this.onlyOwner();

      this.mutableOwner = undefined;
    }

    public transferOwnership(to: Address): boolean {
      this.onlyOwner();
      const owner = this.ownerOrThrow();
      notifyTransferOwnership(owner, to);
      this.mutableOwner = to;

      return true;
    }

    protected ownerOrThrow(): Address {
      const owner = this.owner;

      if (owner === undefined) {
        throw new Error('no owner');
      }

      return owner;
    }

    protected onlyOwner() {
      if (!Address.isCaller(this.ownerOrThrow())) {
        throw new Error('not owner');
      }
    }

    private initializeOwner() {
      if (this.mutableOwner === undefined && !this.mutableOwnerInitialized) {
        this.mutableOwner = this.initialOwner;
        this.mutableOwnerInitialized = true;
      }

      return this.mutableOwner;
    }
  }

  return OwnableClass;
}
