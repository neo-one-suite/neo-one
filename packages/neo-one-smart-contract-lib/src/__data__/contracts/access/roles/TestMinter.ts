import { Address, SmartContract } from '@neo-one/smart-contract';
// tslint:disable-next-line:no-implicit-dependencies
import { MinterRole } from '@neo-one/smart-contract-lib';

export class TestMinter extends MinterRole(SmartContract) {
  public constructor(owner: Address) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
    this.firstMinter(owner);
  }
}
