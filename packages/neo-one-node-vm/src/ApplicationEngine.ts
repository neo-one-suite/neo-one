import { CallFlags, common, TriggerType, VMState } from '@neo-one/client-common';
import {
  Block,
  LoadContractOptions,
  LoadScriptOptions,
  SerializableContainer,
  serializeScriptContainer,
  SnapshotName,
  VMProtocolSettingsIn,
} from '@neo-one/node-core';
import { BN } from 'bn.js';
import _ from 'lodash';
import { convertLog, parseStackItems } from './converters';
import { EngineMethods } from './Methods';
import { DispatcherFunc } from './types';
import { validateProtocolSettings } from './utils';

export interface CreateOptions {
  readonly trigger: TriggerType;
  readonly container?: SerializableContainer;
  readonly snapshot?: SnapshotName;
  readonly persistingBlock?: Block;
  readonly gas: BN;
  readonly settings: VMProtocolSettingsIn;
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

  public get faultException() {
    return this.dispatch({
      method: 'getfaultexception',
    });
  }

  public create({ trigger, container, persistingBlock, gas, snapshot, settings }: CreateOptions) {
    return this.dispatch({
      method: 'create',
      args: {
        trigger,
        container: container ? serializeScriptContainer(container) : undefined,
        gas: gas.toString(),
        persistingBlock: persistingBlock === undefined ? undefined : persistingBlock.serializeWire(),
        snapshot,
        settings: validateProtocolSettings(settings),
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

  public loadScript({ script, rvcount, flags = CallFlags.All, scriptHash, initialPosition }: LoadScriptOptions) {
    return this.dispatch({
      method: 'loadscript',
      args: {
        script,
        rvcount,
        flags,
        scriptHash: scriptHash ? common.uInt160ToHex(scriptHash) : undefined,
        initialPosition,
      },
    });
  }

  public push(item: string) {
    return this.dispatch({
      method: 'push',
      args: {
        item,
      },
    });
  }

  public loadContract({ hash, method, pcount, flags }: LoadContractOptions) {
    return this.dispatch({
      method: 'loadcontract',
      args: {
        hash,
        method,
        pcount,
        flags,
      },
    });
  }

  public checkScript() {
    return this.dispatch({
      method: 'checkscript',
    });
  }
}
