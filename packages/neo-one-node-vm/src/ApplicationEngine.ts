import { TriggerType, VMState } from '@neo-one/client-common';
import { CallFlags, SerializableContainer, serializeScriptContainer, SnapshotName } from '@neo-one/node-core';
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
  readonly testMode: boolean;
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

  public create({ trigger, container, gas, snapshot, testMode }: CreateOptions) {
    return this.dispatch({
      method: 'create',
      args: {
        trigger,
        container: container ? serializeScriptContainer(container) : undefined,
        gas: gas.toString(),
        snapshot,
        testMode,
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

  public loadScript(script: Buffer, flag = CallFlags.All) {
    return this.dispatch({
      method: 'loadscript',
      args: {
        script,
        flag,
      },
    });
  }

  public checkScript() {
    return this.dispatch({
      method: 'checkscript',
    });
  }

  public setInstructionPointer(position: number) {
    return this.dispatch({
      method: 'setinstructionpointer',
      args: { position },
    });
  }
}
