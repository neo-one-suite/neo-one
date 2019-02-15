import { Address, constant, createEventNotifier, MapStorage, SmartContract } from '@neo-one/smart-contract';
import { AccessRoleHandler } from '../AccessRoles';

export function WhitelistAdminRole<TBase extends Constructor<SmartContract>>(Base: TBase) {
  abstract class WhitelistAdminRoleClass extends Base {
    private readonly mutableWhitelistAdminList = MapStorage.for<Address, boolean>();
    private mutableInitialized = false;

    /* tslint:disable-next-line:variable-name */
    private readonly add_whitelist_admin = createEventNotifier<Address, Address>(
      'add whitelist admin',
      'address',
      'by',
    );
    /* tslint:disable-next-line:variable-name */
    private readonly remove_whitelist_admin = createEventNotifier<Address, Address>(
      'remove whitelist admin',
      'address',
      'by',
    );

    @constant
    public isWhitelistAdmin(address: Address): boolean {
      return AccessRoleHandler.isMember(this.mutableWhitelistAdminList, address);
    }

    @constant
    public onlyWhitelistAdmins(address: Address): boolean {
      return Address.isCaller(address) && this.isWhitelistAdmin(address);
    }

    public addWhitelistAdmin(address: Address, requstedBy: Address): boolean {
      if (
        this.onlyWhitelistAdmins(requstedBy) &&
        !AccessRoleHandler.isMember(this.mutableWhitelistAdminList, address) &&
        AccessRoleHandler.add(this.mutableWhitelistAdminList, address)
      ) {
        this.add_whitelist_admin(address, requstedBy);

        return true;
      }

      return false;
    }

    public removeWhitelistAdmin(address: Address, requstedBy: Address): boolean {
      if (
        this.onlyWhitelistAdmins(requstedBy) &&
        AccessRoleHandler.isMember(this.mutableWhitelistAdminList, address) &&
        AccessRoleHandler.remove(this.mutableWhitelistAdminList, address)
      ) {
        this.remove_whitelist_admin(address, requstedBy);

        return true;
      }

      return false;
    }

    protected firstWhitelistAdmin(address: Address): boolean {
      if (!this.mutableInitialized) {
        this.mutableInitialized = true;
        AccessRoleHandler.add(this.mutableWhitelistAdminList, address);

        return true;
      }

      return false;
    }
  }

  return WhitelistAdminRoleClass;
}
