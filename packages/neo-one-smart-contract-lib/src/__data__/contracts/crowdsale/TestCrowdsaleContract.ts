import { Address, Deploy, Fixed } from '@neo-one/smart-contract';
// tslint:disable-next-line:no-implicit-dependencies
import { CrowdsaleContract } from '@neo-one/smart-contract-lib';

export class TestCrowdsaleContract extends CrowdsaleContract() {
  public constructor(protected initialOwner: Address = Deploy.senderAddress) {
    super();
  }
  protected initialCrowdsaleWallet(): Address {
    return Address.from('ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW');
  }
  protected initialCrowdsaleRate(): Fixed<8> {
    return 1_20000000;
  }
  protected initialCrowdsaleToken(): Address {
    return Address.from('ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW');
  }
}
