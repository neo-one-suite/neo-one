import { Address, constant, createEventNotifier, MapStorage, SmartContract } from '@neo-one/smart-contract';
import { AccessRoleHandler } from '../AccessRoles';

export function PauserRole<TBase extends Constructor<SmartContract>>(Base: TBase) {
  abstract class PauserRoleClass extends Base {
    private readonly mutablePauserList = MapStorage.for<Address, boolean>();
    private mutableInitialized = false;

    /* tslint:disable-next-line:variable-name */
    private readonly add_pauser = createEventNotifier<Address, Address>('add pauser', 'address', 'by');
    /* tslint:disable-next-line:variable-name */
    private readonly remove_pauser = createEventNotifier<Address, Address>('remove pauser', 'address', 'by');

    @constant
    public isPauser(address: Address): boolean {
      return AccessRoleHandler.isMember(this.mutablePauserList, address);
    }

    @constant
    public onlyPausers(address: Address): boolean {
      return Address.isCaller(address) && this.isPauser(address);
    }

    public addPauser(address: Address, requstedBy: Address): boolean {
      if (
        this.onlyPausers(requstedBy) &&
        !AccessRoleHandler.isMember(this.mutablePauserList, address) &&
        AccessRoleHandler.add(this.mutablePauserList, address)
      ) {
        this.add_pauser(address, requstedBy);

        return true;
      }

      return false;
    }

    public removePauser(address: Address, requstedBy: Address): boolean {
      if (
        this.onlyPausers(requstedBy) &&
        AccessRoleHandler.isMember(this.mutablePauserList, address) &&
        AccessRoleHandler.remove(this.mutablePauserList, address)
      ) {
        this.remove_pauser(address, requstedBy);

        return true;
      }

      return false;
    }

    protected firstPauser(address: Address): boolean {
      if (!this.mutableInitialized) {
        this.mutableInitialized = true;
        AccessRoleHandler.add(this.mutablePauserList, address);

        return true;
      }

      return false;
    }
  }

  return PauserRoleClass;
}
