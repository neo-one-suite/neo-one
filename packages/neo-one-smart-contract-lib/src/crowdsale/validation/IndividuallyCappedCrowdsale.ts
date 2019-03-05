import { Address, createEventNotifier, SmartContract, Fixed, MapStorage } from '@neo-one/smart-contract';
import { CappedCrowdsale, CapperRole } from '../../';

/* tslint:disable-next-line:variable-name */
const set_cap = createEventNotifier<Address, Fixed<8>, Address>('set participant cap', 'address', 'amount',  'by');


/**
 * @title IndividuallyCappedCrowdsale
 * @dev Crowdsale with per-beneficiary caps.
 */
function IndividuallyCappedCrowdsale<TBase extends Constructor<SmartContract>>(Base: TBase){

  abstract class IndividuallyCappedCrowdsaleClass extends CappedCrowdsale(CapperRole<Constructor<SmartContract>>(Base)){
      protected readonly _contributions =  MapStorage.for<Address, Fixed<8>>();
      protected readonly _caps = MapStorage.for<Address, Fixed<8>>();

    /**
     * @dev Sets a specific beneficiary's maximum contribution.
     * @param beneficiary Address to be capped
     * @param cap neo limit for individual contribution
     */
    public setCap(beneficiary: Address, cap: Fixed<0>, requestedBy: Address): boolean {
      if(!this.isCapper(requestedBy) && this._caps.set(beneficiary, cap) ){
        set_cap(beneficiary, cap, requestedBy);
      }

      return false;
    }

    /**
     * @dev Returns the cap of a specific beneficiary.
     * @param beneficiary Address whose cap is to be checked
     * @return Current cap for individual beneficiary
     */
    public getCap(beneficiary: Address): Fixed<0> {
        const value = this._caps.get(beneficiary);

        return value===undefined ? 0 : value;
    }

    /**
     * @dev Returns the amount contributed so far by a specific beneficiary.
     * @param beneficiary Address of contributor
     * @return Beneficiary contribution so far
     */
    public getContribution(beneficiary: Address): Fixed<0> {
      const value = this._contributions.get(beneficiary);

      return value===undefined ? 0 : value;
    }

    /**
     * @dev Extend parent behavior requiring purchase to respect the beneficiary's funding cap.
     * @param beneficiary Token purchaser
     * @param neoAmount Amount of neo contributed
     */
    public _preValidatePurchase(purchaser: Address,  beneficiary: Address,  neoAmount: Fixed<0>): boolean {
        return (
            super._preValidatePurchase(purchaser, beneficiary, neoAmount)
           && ((this.getContribution(beneficiary) + neoAmount) > this.getCap(beneficiary))
           );
    }

    /**
     * @dev Extend parent behavior to update beneficiary contributions
     * @param beneficiary Token purchaser
     * @param neoAmount Amount of neo contributed
     */
    public _updatePurchasingState(purchaser: Address, beneficiary: Address, neoAmount: Fixed<9>): void {
        super._updatePurchasingState(purchaser, beneficiary, neoAmount);
        this._contributions.set(beneficiary, this.getContribution(beneficiary) + neoAmount;
    }
  }

  return IndividuallyCappedCrowdsaleClass;
}
