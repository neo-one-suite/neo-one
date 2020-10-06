import { DefaultMethods, DispatchMethod } from '../types';

interface InitArgs {
  readonly path?: string;
  readonly settings?: ProtocolSettings;
}

export interface ProtocolSettings {
  readonly magic?: number;
  readonly addressVersion?: number;
  readonly standbyCommittee?: readonly string[];
  readonly committeeMembersCount?: number;
  readonly validatorsCount?: number;
  readonly seedList?: readonly string[];
  readonly millisecondsPerBlock?: number;
  readonly memoryPoolMaxTransactions?: number;
}

export interface ProtocolSettingsReturn {
  readonly magic: number;
  readonly addressVersion: number;
  readonly standbyCommittee: readonly string[];
  readonly committeeMembersCount: number;
  readonly validatorsCount: number;
  readonly seedList: readonly string[];
  readonly millisecondsPerBlock: number;
  readonly memoryPoolMaxTransactions: number;
}

export interface BaseMethods extends DefaultMethods {
  readonly init: DispatchMethod<boolean, InitArgs>;
  readonly dispose_engine: DispatchMethod<boolean>;
  readonly snapshot_reset: DispatchMethod<boolean>;
  readonly dispose: DispatchMethod<boolean>;
  readonly get_config: DispatchMethod<ProtocolSettingsReturn>;
}
