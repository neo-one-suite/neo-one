import { Deploy, SmartContract } from '@neo-one/smart-contract';
/*tslint:disable-next-line:no-implicit-dependencies*/
import { Ownable } from '@neo-one/smart-contract-lib';

export class TestOwnable extends Ownable(SmartContract) {
  public constructor(protected readonly initialOwner = Deploy.senderAddress) {
    super();
  }
  public publicOwnerOrThrow() {
    this.ownerOrThrow();
  }
}
