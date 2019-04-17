import { Address, constant, MapStorage, createEventNotifier } from '@neo-one/smart-contract';
import { AccessRoleHandler } from '../../utils';
import { CrowdsaleContract } from '../CrowdsaleContract';

const notifyAddCapper = createEventNotifier<Address, Address>('add_minter', 'address', 'requested by');
const notifyRemoveCapper = createEventNotifier<Address, Address>('remove_minter', 'address', 'requested by');

export abstract class CrowdsaleWithCapperRole extends CrowdsaleContract() {
  private readonly capperList = MapStorage.for<Address, boolean>();

  @constant
  public isCapper(address: Address): boolean {
    return AccessRoleHandler.isMember(this.capperList, address);
  }

  @constant
  public onlyCappers(address: Address) {
    if (!Address.isCaller(address) && this.isCapper(address)) {
      throw new Error('not a capper');
    }
  }

  public addCapper(address: Address, requestedBy: Address): boolean {
    this.onlyCappers(requestedBy);
    if (!AccessRoleHandler.isMember(this.capperList, address) && AccessRoleHandler.add(this.capperList, address)) {
      notifyAddCapper(address, requestedBy);

      return true;
    }

    return false;
  }

  public removeCapper(address: Address, requestedBy: Address): boolean {
    this.onlyCappers(requestedBy);
    if (AccessRoleHandler.isMember(this.capperList, address) && AccessRoleHandler.remove(this.capperList, address)) {
      notifyRemoveCapper(address, requestedBy);

      return true;
    }

    return false;
  }
  protected initialCapper(account: Address) {
    this.capperList.set(account, true);
  }
}
