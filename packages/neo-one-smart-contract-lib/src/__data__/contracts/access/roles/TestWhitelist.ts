import { Address, SmartContract } from '@neo-one/smart-contract';
// tslint:disable-next-line:no-submodule-imports no-implicit-dependencies
import { WhitelistRole } from '@neo-one/smart-contract-lib/src/access/roles/WhitelistRole';

export class TestWhitelist extends WhitelistRole(SmartContract) {
  public constructor(owner: Address) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
    this.firstWhitelist(owner);
  }
}
