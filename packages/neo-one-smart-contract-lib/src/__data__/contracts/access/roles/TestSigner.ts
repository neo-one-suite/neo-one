import { Address, SmartContract } from '@neo-one/smart-contract';
// tslint:disable-next-line:no-submodule-imports no-implicit-dependencies
import { SignerRole } from '@neo-one/smart-contract-lib/src/access/roles/SignerRole';

export class TestSigner extends SignerRole(SmartContract) {
  public constructor(owner: Address) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
    this.firstSigner(owner);
  }
}
