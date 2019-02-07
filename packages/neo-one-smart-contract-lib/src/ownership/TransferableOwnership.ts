import { Address, constant, createEventNotifier, SmartContract } from '@neo-one/smart-contract';

/**
 * @title Transferable
 * @dev A TransferableOwnership contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */

export function TransferableOwnership<TBase extends Constructor<SmartContract>>(Base: TBase) {
  abstract class TransferableOwnershipClass extends Base {
    protected abstract mutableOwner: Address;
    private mutableTransferTo: Address | undefined;

    @constant
    public get owner(): Address {
      return this.mutableOwner;
    }

    /* tslint:disable-next-line: variable-name */
    private readonly transfer_initiated = createEventNotifier<Address, Address>(
      'contract ownership transfer initiated',
      'from',
      'to',
    );

    /* tslint:disable-next-line: variable-name */
    private readonly transfer_canceled = createEventNotifier<Address, Address>(
      'contract ownership transfer canceled',
      'from',
      'to',
    );

    private readonly transferred = createEventNotifier<Address, Address>('contract ownership transfer', 'from', 'to');

    public transferContract(to: Address): boolean {
      if (Address.isCaller(this.owner)) {
        if (this.owner === to) {
          return this.cancelTransfer();
        }

        return this.initiateTransfer(to);
      }

      if (Address.isCaller(to) && this.mutableTransferTo === to) {
        return this.claimContract(to);
      }

      return false;
    }

    private claimContract(to: Address) {
      this.transferred(this.owner, to);
      this.mutableOwner = to;

      return true;
    }

    private initiateTransfer(to: Address) {
      this.transfer_initiated(this.owner, to);
      this.mutableTransferTo = to;

      return true;
    }

    private cancelTransfer() {
      if (this.mutableTransferTo !== undefined) {
        this.transfer_canceled(this.owner, this.mutableTransferTo);
        this.mutableTransferTo = undefined;
      }

      return true;
    }
  }

  return TransferableOwnershipClass;
}
