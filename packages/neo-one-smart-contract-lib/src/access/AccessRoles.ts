import { Address, MapStorage } from '@neo-one/smart-contract';

export type AccessRoleMemberList = MapStorage<Address, boolean>;

const isMember = (list: AccessRoleMemberList, member: Address): boolean =>
  list.has(member) && list.get(member) === true;

export const AccessRoleHandler = {
  isMember,

  add: (list: AccessRoleMemberList, member: Address): boolean => {
    if (!isMember(list, member)) {
      list.set(member, true);

      return true;
    }

    return false;
  },
  remove: (list: AccessRoleMemberList, member: Address): boolean => {
    if (isMember(list, member)) {
      list.delete(member);

      return true;
    }

    return false;
  },
};
