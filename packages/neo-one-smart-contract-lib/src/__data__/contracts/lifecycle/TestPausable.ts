import { Address, SmartContract } from '@neo-one/smart-contract';
/* tslint:disable-next-line: no-implicit-dependencies */
import { Pausable } from '@neo-one/smart-contract-lib';

export class TestPausable extends Pausable(SmartContract) {
  public constructor(owner: Address) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }

    this.firstPauser(owner);
  }
}
