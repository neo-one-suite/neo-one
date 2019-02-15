import { Address, constant, createEventNotifier, MapStorage, SmartContract } from '@neo-one/smart-contract';
import { AccessRoleHandler } from '../AccessRoles';

export function CapperRole<TBase extends Constructor<SmartContract>>(Base: TBase) {
  abstract class CapperRoleClass extends Base {
    private readonly capperList = MapStorage.for<Address, boolean>();
    private mutableInitialized = false;

    /* tslint:disable-next-line:variable-name */
    private readonly add_capper = createEventNotifier<Address, Address>('add capper', 'address', 'by');
    /* tslint:disable-next-line:variable-name */
    private readonly remove_capper = createEventNotifier<Address, Address>('remove capper', 'address', 'by');

    @constant
    public isCapper(address: Address): boolean {
      return AccessRoleHandler.isMember(this.capperList, address);
    }

    @constant
    public onlyCappers(address: Address): boolean {
      return Address.isCaller(address) && this.isCapper(address);
    }

    public addCapper(address: Address, requstedBy: Address): boolean {
      if (
        this.onlyCappers(requstedBy) &&
        !AccessRoleHandler.isMember(this.capperList, address) &&
        AccessRoleHandler.add(this.capperList, address)
      ) {
        this.add_capper(address, requstedBy);

        return true;
      }

      return false;
    }

    public removeCapper(address: Address, requstedBy: Address): boolean {
      if (
        this.onlyCappers(requstedBy) &&
        AccessRoleHandler.isMember(this.capperList, address) &&
        AccessRoleHandler.remove(this.capperList, address)
      ) {
        this.remove_capper(address, requstedBy);

        return true;
      }

      return false;
    }

    protected firstCapper(address: Address): boolean {
      if (!this.mutableInitialized) {
        this.mutableInitialized = true;
        AccessRoleHandler.add(this.capperList, address);

        return true;
      }

      return false;
    }
  }

  return CapperRoleClass;
}
