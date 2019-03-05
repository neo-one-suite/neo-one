import { Address, Fixed, SmartContract } from '@neo-one/smart-contract';
import { Crowdsale, CapperRole } from '../../../';

/**
 * @title CappedCrowdsale
 * @dev Crowdsale with a limit for total contributions.
 */

export function CappedCrowdsale<TBase extends Constructor<SmartContract>>(Base: TBase) {
  abstract class CappedCrowdsaleClass extends Crowdsale<Constructor<SmartContract>>(Base) {
    // assign a value when you extend this class
    protected abstract _cap: Fixed<0> = 0;

    public get capRemaining(): Fixed<0> {
      return this._cap - this.neoRaised();
    }

    /**
     * @return the cap of the crowdsale.
     */
    public get cap() {
      return this._cap;
    }

    /**
     * @dev Checks whether the cap has been reached.
     * @return Whether the cap was reached
     */
    public capReached(): boolean {
      return this.neoRaised() >= this._cap;
    }

    /**
     * @dev Extend parent behavior requiring purchase to respect the funding cap.
     * @param beneficiary Token purchaser
     * @param neoAmount Amount of neo contributed
     */
    public _preValidatePurchase(purchaser: Address, beneficiary: Address, neoAmount: Fixed<8>): boolean {
      super._preValidatePurchase(purchaser, beneficiary, neoAmount);

      return this.neoRaised() + neoAmount <= this._cap;
    }
  }

  return CappedCrowdsaleClass;
}
