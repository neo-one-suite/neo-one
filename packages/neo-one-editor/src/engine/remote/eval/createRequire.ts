import { MissingPath, ModuleBase } from '../ModuleBase';
import { RemoteEngine } from '../RemoteEngine';

export const createRequire = (engine: RemoteEngine, initiator: ModuleBase, explore: boolean) => {
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
