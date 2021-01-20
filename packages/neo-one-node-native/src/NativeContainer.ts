import { UInt160 } from '@neo-one/client-common';
import { BlockchainSettings } from '@neo-one/node-core';
import { DesignationContract } from './DesignationContract';
import { GASToken } from './GASToken';
import { ManagementContract } from './ManagementContract';
import { NEOToken } from './NEOToken';
import { OracleContract } from './OracleContract';
import { PolicyContract } from './Policy';

export class NativeContainer {
  public readonly Management: ManagementContract;
  public readonly NEO: NEOToken;
  public readonly GAS: GASToken;
  public readonly Policy: PolicyContract;
  public readonly Oracle: OracleContract;
  public readonly Designation: DesignationContract;
  public readonly nativeHashes: readonly UInt160[];

  public constructor(settings: BlockchainSettings) {
    this.Management = new ManagementContract();
    this.NEO = new NEOToken(settings);
    this.GAS = new GASToken();
    this.Policy = new PolicyContract();
    this.Oracle = new OracleContract();
    this.Designation = new DesignationContract();
    this.nativeHashes = [
      this.Management.hash,
      this.NEO.hash,
      this.GAS.hash,
      this.Policy.hash,
      this.Oracle.hash,
      this.Designation.hash,
    ];
  }

  public isNative(hash: UInt160) {
    return this.nativeHashes.some((nativeHash) => hash.equals(nativeHash));
  }
}
