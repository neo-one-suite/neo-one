import { BlockchainSettings } from '@neo-one/node-core';
import { GASToken } from './GASToken';
import { NEOToken } from './NEOToken';
import { PolicyContract } from './Policy';
import { ManagementContract } from './ManagementContract';
import { OracleContract } from './OracleContract';
import { DesignationContract } from './DesignationContract';

export class NativeContainer {
  public readonly Management: ManagementContract;
  public readonly NEO: NEOToken;
  public readonly GAS: GASToken;
  public readonly Policy: PolicyContract;
  public readonly Oracle: OracleContract;
  public readonly Designation: DesignationContract;

  public constructor(settings: BlockchainSettings) {
    this.Management = new ManagementContract();
    this.NEO = new NEOToken(settings);
    this.GAS = new GASToken();
    this.Policy = new PolicyContract();
    this.Oracle = new OracleContract();
    this.Designation = new DesignationContract();
  }
}
