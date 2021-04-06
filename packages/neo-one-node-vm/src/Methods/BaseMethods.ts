import { VMProtocolSettingsIn, VMProtocolSettingsReturn } from '@neo-one/node-core';
import { DefaultMethods, DispatchMethod } from '../types';

interface InitArgs {
  readonly path?: string;
  readonly settings?: VMProtocolSettingsIn;
}

export interface BaseMethods extends DefaultMethods {
  readonly init: DispatchMethod<boolean, InitArgs>;
  readonly dispose_engine: DispatchMethod<boolean>;
  readonly snapshot_reset: DispatchMethod<boolean>;
  readonly dispose: DispatchMethod<boolean>;
  readonly get_config: DispatchMethod<VMProtocolSettingsReturn>;
}
