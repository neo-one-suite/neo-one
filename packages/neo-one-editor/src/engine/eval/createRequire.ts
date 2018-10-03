import { Engine } from '../Engine';
import { ModuleBase } from '../ModuleBase';

export const createRequire = (engine: Engine, initiator: ModuleBase) => {
  function require(path: string) {
    const requiredModule = engine.resolveModule(path, initiator.path);

    return requiredModule.evaluate({ initiator });
  }

  // tslint:disable-next-line no-object-mutation
  require.resolve = (path: string) => {
    const requiredModule = engine.resolveModule(path, initiator.path);

    return requiredModule.path;
  };

  return require;
};
