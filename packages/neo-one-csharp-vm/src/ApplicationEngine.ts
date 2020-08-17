import _ from 'lodash';
import { convertEngineOptions } from './converters';
import { createEngineDispatcher } from './createEngineDispatcher';
import { parse as parseStackItems } from './StackItems';
import { EngineOptions } from './types';

export class ApplicationEngine {
  // getters
  public get trigger() {
    return this.engineDispatcher({
      method: 'gettrigger',
    });
  }

  public get gasConsumed() {
    return this.engineDispatcher({
      method: 'getgasconsumed',
    });
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

  public loadScript(script: Buffer, position = 0) {
    return this.engineDispatcher({
      method: 'loadscript',
      args: {
        script,
        position,
      },
    });
  }

  public checkScript() {
    return this.engineDispatcher({
      method: 'checkscript',
    });
  }

  // not sure if we need this one?
  public loadScriptWithFlags() {
    // not implemented
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

  public test() {
    return this.engineDispatcher({
      method: 'test',
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
