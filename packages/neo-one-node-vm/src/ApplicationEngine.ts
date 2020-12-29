import { TriggerType, VMState, common } from '@neo-one/client-common';
import {
  CallFlags,
  SerializableContainer,
  serializeScriptContainer,
  SnapshotName,
  LoadScriptOptions,
} from '@neo-one/node-core';
import { BN } from 'bn.js';
import _ from 'lodash';
import { parseStackItems, convertLog } from './converters';
import { EngineMethods } from './Methods';
import { DispatcherFunc } from './types';

export interface CreateOptions {
  readonly trigger: TriggerType;
  readonly container?: SerializableContainer;
  readonly snapshot?: SnapshotName;
  readonly gas: BN;
}

interface ApplicationEngineDispatcher {
  readonly dispatch: DispatcherFunc<EngineMethods>;
}

export class ApplicationEngine {
  private readonly dispatch: DispatcherFunc<EngineMethods>;

  public constructor(dispatcher: ApplicationEngineDispatcher) {
    this.dispatch = dispatcher.dispatch.bind(this);
  }

  public get trigger() {
    return TriggerType[
      this.dispatch({
        method: 'gettrigger',
      })
    ];
  }

  public get gasConsumed() {
    try {
      return new BN(
        this.dispatch({
          method: 'getgasconsumed',
        }),
      );
    } catch {
      return new BN(-1);
    }
  }

  public get state() {
    return VMState[
      this.dispatch({
        method: 'getvmstate',
      })
    ];
  }

  public get resultStack() {
    return _.reverse(
      parseStackItems(
        this.dispatch({
          method: 'getresultstack',
        }),
      ),
    );
  }

  public get notifications() {
    return parseStackItems(
      this.dispatch({
        method: 'getnotifications',
      }),
    );
  }

  public get logs() {
    return this.dispatch({
      method: 'getlogs',
    }).map(convertLog);
  }

  public create({ trigger, container, gas, snapshot }: CreateOptions) {
    return this.dispatch({
      method: 'create',
      args: {
        trigger,
        container: container ? serializeScriptContainer(container) : undefined,
        gas: gas.toString(),
        snapshot,
      },
    });
  }

  public execute() {
    return VMState[
      this.dispatch({
        method: 'execute',
      })
    ];
  }

  public loadScript({ script, flags = CallFlags.All, scriptHash, initialPosition }: LoadScriptOptions) {
    return this.dispatch({
      method: 'loadscript',
      args: {
        script,
        flags,
        scriptHash: scriptHash ? common.uInt160ToHex(scriptHash) : undefined,
        initialPosition,
      },
    });
  }

  public checkScript() {
    return this.dispatch({
      method: 'checkscript',
    });
  }
}
