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

export class AccessRole implements Role {
  private readonly members: MapStorage<Address, boolean>;

  public constructor() {
    this.members = MapStorage.for<Address, boolean>();
  }

  @constant
  public hasMember(address: Address): boolean {
    if (!this.members.has(address)) {
      return false;
    }

    return !!this.members.get(address);
  }

  public add(address: Address): boolean {
    if (this.hasMember(address)) {
      return false;
    }

    this.members.set(address, true);

    return true;
  }

  public remove(address: Address): boolean {
    if (this.hasMember(address)) {
      return false;
    }

    this.members.set(address, true);

    return true;
  }
}
