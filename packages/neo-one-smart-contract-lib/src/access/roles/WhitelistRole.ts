import { Address, constant, createEventNotifier, MapStorage, SmartContract } from '@neo-one/smart-contract';
import { AccessRoleHandler } from '../AccessRoles';

/* tslint:disable-next-line:variable-name */
const add_whitelist = createEventNotifier<Address, Address>('add whitelist', 'address', 'by');
/* tslint:disable-next-line:variable-name */
const remove_whitelist = createEventNotifier<Address, Address>('remove whitelist', 'address', 'by');

export function WhitelistRole<TBase extends Constructor<SmartContract>>(Base: TBase) {
  abstract class WhitelistRoleClass extends Base {
    private readonly mutableWhitelistList = MapStorage.for<Address, boolean>();
    private mutableInitialized = false;

    @constant
    public isWhitelisted(address: Address): boolean {
      return AccessRoleHandler.isMember(this.mutableWhitelistList, address);
    }

    @constant
    public onlyWhitelisted(address: Address): boolean {
      return Address.isCaller(address) && this.isWhitelisted(address);
    }

    public addWhitelist(address: Address, requstedBy: Address): boolean {
      if (
        this.onlyWhitelisted(requstedBy) &&
        !AccessRoleHandler.isMember(this.mutableWhitelistList, address) &&
        AccessRoleHandler.add(this.mutableWhitelistList, address)
      ) {
        add_whitelist(address, requstedBy);

        return true;
      }

      return false;
    }

    public removeWhitelist(address: Address, requstedBy: Address): boolean {
      if (
        this.onlyWhitelisted(requstedBy) &&
        AccessRoleHandler.isMember(this.mutableWhitelistList, address) &&
        AccessRoleHandler.remove(this.mutableWhitelistList, address)
      ) {
        remove_whitelist(address, requstedBy);

        return true;
      }

      return false;
    }

    protected firstWhitelist(address: Address): boolean {
      if (!this.mutableInitialized) {
        this.mutableInitialized = true;
        AccessRoleHandler.add(this.mutableWhitelistList, address);

        return true;
      }

      return false;
    }
  }

  return WhitelistRoleClass;
}
