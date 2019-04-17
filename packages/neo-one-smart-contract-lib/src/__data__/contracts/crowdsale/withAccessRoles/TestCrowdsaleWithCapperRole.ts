import { Address, Deploy, Fixed } from '@neo-one/smart-contract';
// tslint:disable-next-line:no-implicit-dependencies
import { CrowdsaleWithCapperRole } from '@neo-one/smart-contract-lib';

export class TestCrowdsaleWithCapperRole extends CrowdsaleWithCapperRole {
  public constructor(protected initialOwner: Address = Deploy.senderAddress) {
    super();
    this.initialCapper(initialOwner);
  }
  protected initialCrowdsaleCap(): Fixed<8> {
    return 100_000_000_00000000;
  }
  protected initialCrowdsaleWallet(): Address {
    return Address.from('ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW');
  }
  protected initialCrowdsaleToken(): Address {
    return Address.from('ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW');
  }
  protected initialCrowdsaleRate(): Fixed<8> {
    return 1_20000000;
  }
}
