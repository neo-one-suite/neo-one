import { Address, Deploy, Fixed } from '@neo-one/smart-contract';
// tslint:disable-next-line:no-implicit-dependencies
import { CappedCrowdsale } from '@neo-one/smart-contract-lib';

export class TestCappedCrowdsale extends CappedCrowdsale {
  public constructor(protected initialOwner: Address = Deploy.senderAddress) {
    super();
  }
  protected initialCrowdsaleCap(): Fixed<8> {
    return 99_00000000;
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
