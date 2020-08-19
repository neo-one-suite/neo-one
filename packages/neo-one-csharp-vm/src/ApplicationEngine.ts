import { common } from '@neo-one/client-common';
import { CallFlags, TriggerType, Verifiable } from '@neo-one/csharp-core';
import { BN } from 'bn.js';
import _ from 'lodash';
import { convertEngineOptions } from './converters';
import { createEngineDispatcher } from './createEngineDispatcher';
import { parse as parseStackItems } from './StackItems';

export interface EngineOptions {
  readonly trigger: TriggerType;
  readonly container?: Verifiable;
  readonly snapshot?: boolean;
  readonly gas: number;
  readonly testMode?: boolean;
}

export class ApplicationEngine {
  public get trigger() {
    return this.engineDispatcher({
      method: 'gettrigger',
    });
  }

  // TODO: make sure the fixed8 numbers are the same between c# and what I'm inputting (just for ease of mind);
  public get gasConsumed() {
    return common
      .fixed8ToDecimal(
        new BN(
          this.engineDispatcher({
            method: 'getgasconsumed',
          }),
        ),
      )
      .toNumber();
  }

  public get gasLeft() {
    return this.engineDispatcher({
      method: 'getgasleft',
    });
  }

  public get currentScriptHash() {
    return this.engineDispatcher({
      method: 'getcurrentscripthash',
    });
  }

  public get callingScriptHash() {
    return this.engineDispatcher({
      method: 'getcallingscripthash',
    });
  }

  public get entryScriptHash() {
    return this.engineDispatcher({
      method: 'getentryscripthash',
    });
  }

  public get notifications() {
    return this.engineDispatcher({
      method: 'getnotifications',
    });
  }

  public get state() {
    return this.engineDispatcher({
      method: 'getvmstate',
    });
  }

  // we reverse the resultStack since we don't want to use `pop`.
  public get resultStack() {
    return _.reverse(
      parseStackItems(
        this.engineDispatcher({
          method: 'getresultstack',
        }),
      ),
    );
  }

  public readonly init: boolean;
  private readonly engineDispatcher: ReturnType<typeof createEngineDispatcher>;

  public constructor(options: EngineOptions) {
    this.engineDispatcher = createEngineDispatcher();
    this.init = this.engineDispatcher({
      method: 'create',
      args: convertEngineOptions(options),
    });
  }

  // -- application engine method definitions
  public dispose() {
    return this.engineDispatcher({
      method: 'dispose',
    });
  }

  public execute() {
    return this.engineDispatcher({
      method: 'execute',
    });
  }

  public loadScript(script: Buffer, callFlags = CallFlags.None) {
    return this.engineDispatcher({
      method: 'loadscript',
      args: {
        script,
        callFlags,
      },
    });
  }

  public checkScript() {
    return this.engineDispatcher({
      method: 'checkscript',
    });
  }

  // - start - some ExecutionEngine method definitions we might need under the hood
  public loadClonedContext(position: number) {
    return this.engineDispatcher({
      method: 'loadclonedcontext',
      args: { position },
    });
  }

  public peek(index = 0) {
    return this.engineDispatcher({
      method: 'peek',
      args: {
        index,
      },
    });
  }

  public pop() {
    return this.engineDispatcher({
      method: 'pop',
    });
  }

  public test(value: BN) {
    return this.engineDispatcher({
      method: 'test',
      args: {
        test: value.toNumber(),
      },
    });
  }
}

// should be our equivalent of `(using var engine = new ApplicationEngine(...)) {...}`
export const withApplicationEngine = <T = void>(options: EngineOptions, func: (engine: ApplicationEngine) => T): T => {
  const engine = new ApplicationEngine(options);
  const result = func(engine);
  engine.dispose();

  return result;
};
