import { common } from '@neo-one/client-common';

/**
 * Common `AddressString`s.
 */
export const Hash160 = {
  /**
   * `AddressString` of the native NEO conract.
   */
  NEO: common.uInt160ToString(common.nativeHashes.NEO),
  /**
   * `AddressString` of the native GAS conract.
   */
  GAS: common.uInt160ToString(common.nativeHashes.GAS),
};
