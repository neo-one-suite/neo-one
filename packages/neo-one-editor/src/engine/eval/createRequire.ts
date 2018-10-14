import { EngineBase } from '../EngineBase';
import { ModuleBase } from '../ModuleBase';

export const createRequire = (engine: EngineBase, initiator: ModuleBase, useEval = false) => {
  function require(path: string) {
    const requiredModule = engine.resolveModule(path, initiator.path);

    return requiredModule.evaluate({ initiator, useEval });
  }

  // tslint:disable-next-line no-object-mutation
  require.resolve = (path: string) => {
    const requiredModule = engine.resolveModule(path, initiator.path);

    return requiredModule.path;
  };

  return require;
};
