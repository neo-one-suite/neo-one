import { EngineBase } from '../EngineBase';
import { MissingPath, ModuleBase } from '../ModuleBase';

export const createRequire = (engine: EngineBase, initiator: ModuleBase, explore: boolean) => {
  function require(path: string) {
    let requiredModule: ModuleBase;
    try {
      requiredModule = engine.resolveModule(path, initiator.path);
    } catch (error) {
      if (explore) {
        if (error.code === 'MODULE_NOT_FOUND_ERROR') {
          // tslint:disable-next-line no-array-mutation
          require.missingPaths.push({ request: path, currentPath: initiator.path });
        }

        return {};
      }

      throw error;
    }

    if (explore) {
      const { exports, missingPaths } = requiredModule.evaluateExplore({ initiator });
      // tslint:disable-next-line no-array-mutation
      require.missingPaths.push(...missingPaths);

      return exports;
    }

    return requiredModule.evaluate({ initiator });
  }

  // tslint:disable-next-line no-object-mutation
  require.resolve = (path: string) => {
    const requiredModule = engine.resolveModule(path, initiator.path);

    return requiredModule.path;
  };

  // tslint:disable-next-line no-object-mutation
  require.missingPaths = [] as MissingPath[];

  return require;
};
