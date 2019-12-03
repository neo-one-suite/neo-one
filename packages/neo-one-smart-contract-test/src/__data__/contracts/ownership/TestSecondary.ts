import { Deploy, SmartContract } from '@neo-one/smart-contract';
/*tslint:disable-next-line:no-implicit-dependencies*/
import { Secondary } from '@neo-one/smart-contract-lib';

export class TestSecondary extends Secondary(SmartContract) {
  public constructor(protected readonly initialPrimary = Deploy.senderAddress) {
    super();
  }
}
