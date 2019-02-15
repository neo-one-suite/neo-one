import { Address, constant, createEventNotifier, MapStorage, SmartContract } from '@neo-one/smart-contract';
import { AccessRoleHandler } from '../AccessRoles';

export function MinterRole<TBase extends Constructor<SmartContract>>(Base: TBase) {
  abstract class MinterRoleClass extends Base {
    private readonly mutableMinterList = MapStorage.for<Address, boolean>();
    private mutableInitialized = false;

    /* tslint:disable-next-line:variable-name */
    private readonly add_minter = createEventNotifier<Address, Address>('add minter', 'address', 'by');
    /* tslint:disable-next-line:variable-name */
    private readonly remove_minter = createEventNotifier<Address, Address>('remove minter', 'address', 'by');

    @constant
    public isMinter(address: Address): boolean {
      return AccessRoleHandler.isMember(this.mutableMinterList, address);
    }

    @constant
    public onlyMinters(address: Address): boolean {
      return Address.isCaller(address) && this.isMinter(address);
    }

    public addMinter(address: Address, requstedBy: Address): boolean {
      if (
        this.onlyMinters(requstedBy) &&
        !AccessRoleHandler.isMember(this.mutableMinterList, address) &&
        AccessRoleHandler.add(this.mutableMinterList, address)
      ) {
        this.add_minter(address, requstedBy);

        return true;
      }

      return false;
    }

    public removeMinter(address: Address, requstedBy: Address): boolean {
      if (
        this.onlyMinters(requstedBy) &&
        AccessRoleHandler.isMember(this.mutableMinterList, address) &&
        AccessRoleHandler.remove(this.mutableMinterList, address)
      ) {
        this.remove_minter(address, requstedBy);

        return true;
      }

      return false;
    }

    protected firstMinter(address: Address): boolean {
      if (!this.mutableInitialized) {
        this.mutableInitialized = true;
        AccessRoleHandler.add(this.mutableMinterList, address);

        return true;
      }

      return false;
    }
  }

  return MinterRoleClass;
}
