import { Address, constant, createEventNotifier, Fixed } from '@neo-one/smart-contract';
import { CrowdsaleContract } from '../CrowdsaleContract';

/* tslint:disable-next-line:variable-name */
const notifyCapReached = createEventNotifier('cap_reached');

export abstract class CappedCrowdsale extends CrowdsaleContract() {
  public readonly cap: Fixed<8> = this.initialCrowdsaleCap();

  @constant
  public capReached() {
    return this.neoRaised >= this.cap;
  }

  protected preValidatePurchase(account: Address, amount: Fixed<8>) {
    if (this.neoRaised + amount > this.cap) {
      throw new Error(`${amount} ${this.neoRaised} already at cap ${this.cap}`);
    }
    super.preValidatePurchase(account, amount);
  }

  protected updatePurchasingState(account: Address, amount: Fixed<8>) {
    if (this.capReached()) {
      notifyCapReached();
    }
    super.updatePurchasingState(account, amount);
  }

  protected initialCrowdsaleCap(): Fixed<8> {
    throw new Error(' override this with a function that returns a number e.g.:  100_000_000_00000000');
  }
}
