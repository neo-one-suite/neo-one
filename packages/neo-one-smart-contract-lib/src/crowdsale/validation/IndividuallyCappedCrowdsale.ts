import { Address, constant, createEventNotifier, Fixed, MapStorage } from '@neo-one/smart-contract';
import { CrowdsaleWithCapperRole } from '../withAccessRoles';

const notifySetCap = createEventNotifier<Address, Fixed<8>, Address>('cap set', 'account', 'amount', 'by');

export abstract class IndividuallyCappedCrowdsale extends CrowdsaleWithCapperRole {
  protected readonly contributions = MapStorage.for<Address, Fixed<8>>();
  protected readonly individualCaps = MapStorage.for<Address, Fixed<8>>();

  public setCap(account: Address, amount: Fixed<8>, requestedBy: Address): boolean {
    this.positiveOnly(amount);
    this.onlyCappers(requestedBy);
    notifySetCap(account, amount, requestedBy);
    this.individualCaps.set(account, amount);

    return true;
  }

  @constant
  public getContributions(account: Address): Fixed<8> {
    const contribs = this.contributions.get(account);

    if (contribs === undefined) {
      return 0;
    }

    return contribs;
  }

  @constant
  public getCap(account: Address): Fixed<8> {
    const cap = this.individualCaps.get(account);
    if (cap === undefined) {
      return 0;
    }

    return cap;
  }

  protected positiveOnly(num: Fixed<8>) {
    if (num < 0) {
      throw new Error('no negative purchase');
    }
  }

  protected preValidatePurchase(account: Address, amount: Fixed<8>) {
    this.positiveOnly(amount);
    super.preValidatePurchase(account, amount);
    const accountCap = this.getCap(account);
    const curBalance = this.getContributions(account);
    const newBalance = curBalance + amount;
    if (newBalance > accountCap) {
      throw new Error(
        `Adding ${amount} to the current balance of ${curBalance} will exceed the allowed cap of ${accountCap}`,
      );
    }
  }

  protected updatePurchasingState(account: Address, amount: Fixed<8>, announce?: boolean) {
    super.updatePurchasingState(account, amount);
    this.contributions.set(account, this.getContributions(account) + amount);

    if (announce) {
      throw new Error(`adding ${amount} to ${account}'s contributions`);
    }
  }
}
