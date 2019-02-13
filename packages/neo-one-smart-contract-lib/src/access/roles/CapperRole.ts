import { Address, constant, createEventNotifier, SmartContract } from '@neo-one/smart-contract';

import { Role } from '../AccessRole';

/**
 *
 * @param Base
 *
 * Initialize in your constuctor by calling:
 *  this.initialCapper(owner);
 */

export function CapperRole<TBase extends Constructor<SmartContract>>(Base: TBase) {
  abstract class CapperRoleClass extends Base {
    private mutableCappers: Role | undefined;

    /* tslint:disable-next-line: variable-name */
    private readonly added_capper = createEventNotifier<Address, Address>('granted capper rights', 'address', 'by');
    /* tslint:disable-next-line: variable-name */
    private readonly revoke_capper = createEventNotifier<Address, Address>('revoked capper rights', 'address', 'by');

    public onlyCapper(address: Address): boolean {
      return this.mutableCappers !== undefined && Address.isCaller(address) && this.mutableCappers.hasMember(address);
    }

    public addCapper(address: Address, requestedBy: Address): boolean {
      if (!this.onlyCapper(requestedBy)) {
        return false;
      }

      this.added_capper(address, requestedBy);

      return this._addCapper(address);
    }

    @constant
    public isCapper(address: Address): boolean {
      return this.mutableCappers !== undefined && this.mutableCappers.hasMember(address);
    }

    public renounceCapper(address: Address, requestedBy: Address): boolean {
      if (!this.onlyCapper(requestedBy)) {
        return false;
      }

      this.revoke_capper(address, requestedBy);

      return this._removeCapper(address);
    }

    protected initialCapper(address: Address) {
      if (!Address.isCaller(address) || this.mutableCappers !== undefined) {
        return false;
      }
      this.added_capper(address, address);

      return this._addCapper(address);
    }

    private _addCapper(address: Address) {
      if (this.mutableCappers === undefined) {
        return false;
      }

      this.mutableCappers.add(address);

      return true;
    }

    private _removeCapper(address: Address) {
      if (this.mutableCappers === undefined) {
        return false;
      }

      this.mutableCappers.remove(address);

      return true;
    }
  }

  return CapperRoleClass;
}
