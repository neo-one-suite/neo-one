import { common, scriptHashToAddress } from '@neo-one/client-common';

/**
 * Common `AddressString`s.
 */
export const Hash160 = {
  /**
   * `AddressString` of the native NEO conract.
   */
  NEO: scriptHashToAddress(common.nativeScriptHashes.NEO),
  /**
   * `AddressString` of the native GAS conract.
   */
  GAS: scriptHashToAddress(common.nativeScriptHashes.GAS),
  /**
   * `AddressString` of the native Policy conract.
   */
  Policy: scriptHashToAddress(common.nativeScriptHashes.Policy),
};
