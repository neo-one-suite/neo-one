import { UInt160 } from '@neo-one/client-common';
import { BlockchainSettings, NativeContainer as NativeContainerNode, NativeContract } from '@neo-one/node-core';
import { ContractManagement } from './ContractManagement';
import { CryptoLib } from './CryptoLib';
import { GASToken } from './GASToken';
import { LedgerContract } from './LedgerContract';
import { NEOToken } from './NEOToken';
import { OracleContract } from './OracleContract';
import { PolicyContract } from './Policy';
import { RoleManagement } from './RoleManagement';
import { StdLib } from './StdLib';

export class NativeContainer implements NativeContainerNode {
  public readonly ContractManagement: ContractManagement;
  public readonly Ledger: LedgerContract;
  public readonly NEO: NEOToken;
  public readonly GAS: GASToken;
  public readonly Policy: PolicyContract;
  public readonly RoleManagement: RoleManagement;
  public readonly Oracle: OracleContract;
  public readonly CryptoLib: CryptoLib;
  public readonly StdLib: StdLib;
  public readonly nativeHashes: readonly UInt160[];
  public readonly nativeContracts: readonly NativeContract[];

  public constructor(settings: BlockchainSettings) {
    this.ContractManagement = new ContractManagement(settings);
    this.Ledger = new LedgerContract(settings);
    this.NEO = new NEOToken(settings);
    this.GAS = new GASToken(settings);
    this.Policy = new PolicyContract(settings);
    this.RoleManagement = new RoleManagement(settings);
    this.Oracle = new OracleContract(settings);
    this.CryptoLib = new CryptoLib(settings);
    this.StdLib = new StdLib(settings);
    this.nativeContracts = [
      this.ContractManagement,
      this.Ledger,
      this.NEO,
      this.GAS,
      this.Policy,
      this.RoleManagement,
      this.Oracle,
      this.CryptoLib,
      this.StdLib,
    ];
    this.nativeHashes = this.nativeContracts.map((contract) => contract.hash);
  }

  public isNative(hash: UInt160) {
    return this.nativeHashes.some((nativeHash) => hash.equals(nativeHash));
  }
}
