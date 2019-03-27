import { Address, SmartContract } from '@neo-one/smart-contract';
// tslint:disable-next-line no-implicit-dependencies
import { TransferableOwnership } from '@neo-one/smart-contract-lib';

export class TransferableContract extends TransferableOwnership(SmartContract) {
  protected mutableOwner: Address;

  public constructor(owner: Address) {
    super();
    this.mutableOwner = owner;
  }
}
