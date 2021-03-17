import { UInt160 } from '@neo-one/client-common';
import { BlockchainSettings, NativeContainer as NativeContainerNode, NativeContract } from '@neo-one/node-core';
import { ContractManagement } from './ContractManagement';
import { GASToken } from './GASToken';
import { LedgerContract } from './LedgerContract';
import { NameService } from './NameService';
import { NEOToken } from './NEOToken';
import { OracleContract } from './OracleContract';
import { PolicyContract } from './Policy';
import { RoleManagement } from './RoleManagement';

export class NativeContainer implements NativeContainerNode {
  public readonly ContractManagement: ContractManagement;
  public readonly Ledger: LedgerContract;
  public readonly NEO: NEOToken;
  public readonly GAS: GASToken;
  public readonly Policy: PolicyContract;
  public readonly RoleManagement: RoleManagement;
  public readonly Oracle: OracleContract;
  public readonly NameService: NameService;
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
    this.NameService = new NameService(settings);
    this.nativeHashes = [
      this.ContractManagement.hash,
      this.Ledger.hash,
      this.NEO.hash,
      this.GAS.hash,
      this.Policy.hash,
      this.RoleManagement.hash,
      this.Oracle.hash,
      this.NameService.hash,
    ];
    this.nativeContracts = [
      this.ContractManagement,
      this.Ledger,
      this.NEO,
      this.GAS,
      this.Policy,
      this.RoleManagement,
      this.Oracle,
      this.NameService,
    ];
  }

  public isNative(hash: UInt160) {
    return this.nativeHashes.some((nativeHash) => hash.equals(nativeHash));
  }
}
