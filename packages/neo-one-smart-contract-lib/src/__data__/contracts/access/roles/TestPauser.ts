import { Address, SmartContract } from '@neo-one/smart-contract';
// tslint:disable-next-line:no-submodule-imports no-implicit-dependencies
import { PauserRole } from '@neo-one/smart-contract-lib/src/access/roles/PauserRole';

export class TestPauser extends PauserRole(SmartContract) {
  public constructor(owner: Address) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
    this.firstPauser(owner);
  }
}
