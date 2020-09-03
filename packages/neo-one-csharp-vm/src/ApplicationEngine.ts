import { common, VMState } from '@neo-one/client-common';
import { SnapshotName, TriggerType, Verifiable } from '@neo-one/csharp-core';
import { BN } from 'bn.js';
import _ from 'lodash';
import { EngineMethods } from './Methods';
import { parse as parseStackItems } from './StackItems';
import { DispatcherFunc } from './types';

export interface CreateOptions {
  readonly trigger: TriggerType;
  readonly container?: Verifiable;
  readonly snapshot?: SnapshotName;
  readonly gas: number;
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
    return this.dispatch({
      method: 'gettrigger',
    });
  }

  public get gasConsumed() {
    return common
      .fixed8ToDecimal(
        new BN(
          this.dispatch({
            method: 'getgasconsumed',
          }),
        ),
      )
      .toNumber();
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

  public create({ trigger, container, gas, snapshot, testMode }: CreateOptions) {
    return this.dispatch({
      method: 'create',
      args: {
        trigger,
        container,
        gas: common.fixed8FromDecimal(gas.toString()).toString(),
        snapshot,
        testMode,
      },
    });
  }

  public execute() {
    return this.dispatch({
      method: 'execute',
    });
  }

  public loadScript(script: Buffer) {
    return this.dispatch({
      method: 'loadscript',
      args: {
        script,
      },
    });
  }

  public checkScript() {
    return this.dispatch({
      method: 'checkscript',
    });
  }

  public loadClonedContext(position: number) {
    return this.dispatch({
      method: 'loadclonedcontext',
      args: { position },
    });
  }
}
