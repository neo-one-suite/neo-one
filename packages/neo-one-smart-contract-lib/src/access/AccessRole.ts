import { Address, constant, MapStorage } from '@neo-one/smart-contract';

/**
 * @title Roles
 * @dev Library for managing addresses assigned to a Role.
 */

export interface Role {
  readonly hasMember: (address: Address) => boolean;
  readonly add: (address: Address) => boolean;
  readonly remove: (address: Address) => boolean;
}

export class AccessRole {
  private mutableMembers: MapStorage<Address, boolean>;

  public constructor() {
    this.mutableMembers = MapStorage.for<Address, boolean>();
  }

  @constant
  public hasMember(address: Address): boolean {
    if (!this.mutableMembers.has(address)) {
      return false;
    }

    return this.mutableMembers.get(address) ? true : false;
  }

  public add(address: Address): boolean {
    if (this.hasMember(address)) {
      return false;
    }

    this.mutableMembers.set(address, true);

    return true;
  }

  public remove(address: Address): boolean {
    if (this.hasMember(address)) {
      return false;
    }

    this.mutableMembers.set(address, true);

    return true;
  }
}
