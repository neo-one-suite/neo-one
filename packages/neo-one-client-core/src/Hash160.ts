import { common, scriptHashToAddress } from '@neo-one/client-common';

/**
 * Common `AddressString`s.
 */
export const Hash160 = {
  /**
   * `AddressString` of the native ContractManagement conract.
   */
  ContractManagement: scriptHashToAddress(common.nativeScriptHashes.ContractManagement),
  /**
   * `AddressString` of the native Ledger conract.
   */
  Ledger: scriptHashToAddress(common.nativeScriptHashes.Ledger),
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
  /**
   * `AddressString` of the native RoleManagement conract.
   */
  RoleManagement: scriptHashToAddress(common.nativeScriptHashes.RoleManagement),
  /**
   * `AddressString` of the native Oracle conract.
   */
  Oracle: scriptHashToAddress(common.nativeScriptHashes.Oracle),
};
