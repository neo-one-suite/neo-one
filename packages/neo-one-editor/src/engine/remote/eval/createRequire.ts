import { MissingPath, ModuleBase } from '../ModuleBase';
import { RemoteEngine } from '../RemoteEngine';

export const createRequire = (engine: RemoteEngine, initiator: ModuleBase, exploreID?: string) => {
  function require(path: string) {
    let requiredModule: ModuleBase;
    try {
      requiredModule = engine.resolveModule(path, initiator.path);
    } catch (error) {
      if (exploreID !== undefined) {
        if (error.code === 'MODULE_NOT_FOUND_ERROR') {
          // tslint:disable-next-line no-array-mutation
          require.missingPaths.push({ request: path, currentPath: initiator.path });
        }

        return {};
      }

      throw error;
    }

    if (exploreID !== undefined) {
      const { exports, missingPaths } = requiredModule.evaluateExplore({ initiator, id: exploreID });
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
