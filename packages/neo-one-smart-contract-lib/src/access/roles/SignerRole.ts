import { Address, constant, createEventNotifier, MapStorage, SmartContract } from '@neo-one/smart-contract';
import { AccessRoleHandler } from '../AccessRoles';

export function SignerRole<TBase extends Constructor<SmartContract>>(Base: TBase) {
  abstract class SignerRoleClass extends Base {
    private readonly mutableSignerList = MapStorage.for<Address, boolean>();
    private mutableInitialized = false;

    /* tslint:disable-next-line:variable-name */
    private readonly add_signer = createEventNotifier<Address, Address>('add signer', 'address', 'by');
    /* tslint:disable-next-line:variable-name */
    private readonly remove_signer = createEventNotifier<Address, Address>('remove signer', 'address', 'by');

    @constant
    public isSigner(address: Address): boolean {
      return AccessRoleHandler.isMember(this.mutableSignerList, address);
    }

    @constant
    public onlySigners(address: Address): boolean {
      return Address.isCaller(address) && this.isSigner(address);
    }

    public addSigner(address: Address, requstedBy: Address): boolean {
      if (
        this.onlySigners(requstedBy) &&
        !AccessRoleHandler.isMember(this.mutableSignerList, address) &&
        AccessRoleHandler.add(this.mutableSignerList, address)
      ) {
        this.add_signer(address, requstedBy);

        return true;
      }

      return false;
    }

    public removeSigner(address: Address, requstedBy: Address): boolean {
      if (
        this.onlySigners(requstedBy) &&
        AccessRoleHandler.isMember(this.mutableSignerList, address) &&
        AccessRoleHandler.remove(this.mutableSignerList, address)
      ) {
        this.remove_signer(address, requstedBy);

        return true;
      }

      return false;
    }

    protected firstSigner(address: Address): boolean {
      if (!this.mutableInitialized) {
        this.mutableInitialized = true;
        AccessRoleHandler.add(this.mutableSignerList, address);

        return true;
      }

      return false;
    }
  }

  return SignerRoleClass;
}
