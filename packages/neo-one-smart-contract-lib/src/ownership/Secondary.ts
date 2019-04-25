import { Address, createEventNotifier, SmartContract } from '@neo-one/smart-contract';

const notifyTransferPrimary = createEventNotifier<Address, Address>('transfer_primary', 'from', 'to');

export function Secondary<TBase extends Constructor<SmartContract>>(base: TBase) {
  abstract class SecondaryClass extends base {
    protected abstract readonly initialPrimary: Address;
    private mutablePrimary: Address | undefined = undefined;
    private mutablePrimaryInitialized = false;

    public get primary(): Address | undefined {
      return this.mutablePrimary !== undefined ? this.mutablePrimary : this.initializePrimary();
    }

    public transferPrimary(to: Address): boolean {
      this.onlyPrimary();
      const primary = this.primaryOrThrow();
      notifyTransferPrimary(primary, to);
      this.mutablePrimary = to;

      return true;
    }

    protected primaryOrThrow(): Address {
      const primary = this.primary;

      if (primary === undefined) {
        throw new Error('no primary');
      }

      return primary;
    }

    protected onlyPrimary() {
      if (!Address.isCaller(this.primaryOrThrow())) {
        throw new Error('not primary');
      }
    }

    private initializePrimary() {
      if (this.mutablePrimary === undefined && !this.mutablePrimaryInitialized) {
        this.mutablePrimary = this.initialPrimary;
        this.mutablePrimaryInitialized = true;
      }

      return this.mutablePrimary;
    }
  }

  return SecondaryClass;
}
