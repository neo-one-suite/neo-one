import { Address, SmartContract } from '@neo-one/smart-contract';
// tslint:disable-next-line:no-implicit-dependencies
import { WhitelistAdminRole } from '@neo-one/smart-contract-lib';

export class TestWhitelistAdmin extends WhitelistAdminRole(SmartContract) {
  public constructor(owner: Address) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
    this.firstWhitelistAdmin(owner);
  }
}
