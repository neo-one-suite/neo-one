import { Address, constant, MapStorage, createEventNotifier } from '@neo-one/smart-contract';
import { AccessRoleHandler } from '../../utils';
import { CrowdsaleContract } from '../CrowdsaleContract';

const notifyAddMinter = createEventNotifier<Address, Address>('add_minter', 'address', 'requested by');
const notifyRemoveMinter = createEventNotifier<Address, Address>('remove_minter', 'address', 'requested by');

export abstract class CrowdsaleWithMinterRole extends CrowdsaleContract() {
  private readonly minterList = MapStorage.for<Address, boolean>();

  @constant
  public isMinter(address: Address): boolean {
    return AccessRoleHandler.isMember(this.minterList, address) && AccessRoleHandler.isMember(this.minterList, address);
  }

  @constant
  public onlyMinters(address: Address) {
    if (!Address.isCaller(address) && this.isMinter(address)) {
      throw new Error('not a capper');
    }
  }

  public addMinter(address: Address, requestedBy: Address): boolean {
    this.onlyMinters(requestedBy);
    if (!AccessRoleHandler.isMember(this.minterList, address) && AccessRoleHandler.add(this.minterList, address)) {
      notifyAddMinter(address, requestedBy);

      return true;
    }

    return false;
  }

  public removeMinter(address: Address, requestedBy: Address): boolean {
    this.onlyMinters(requestedBy);
    if (AccessRoleHandler.isMember(this.minterList, address) && AccessRoleHandler.remove(this.minterList, address)) {
      notifyRemoveMinter(address, requestedBy);

      return true;
    }

    return false;
  }
  protected initialMinter(account: Address) {
    this.minterList.set(account, true);
  }
}
