import { Address, SmartContract } from '@neo-one/smart-contract';
/* tslint:disable-next-line: no-implicit-dependencies */
import { Pausable, PauserRole } from '@neo-one/smart-contract-lib';

export class TestPauser extends Pausable(SmartContract) {
  public constructor(owner: Address) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
    this.firstPauser(owner);
  }
}
