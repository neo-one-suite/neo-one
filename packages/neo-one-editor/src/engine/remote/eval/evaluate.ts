import { MissingPath } from '../ModuleBase';
import { RemoteEngine } from '../RemoteEngine';
import { TranspiledModule } from '../TranspiledModule';
import { Exports } from '../types';
import { createRequire } from './createRequire';

// tslint:disable
// @ts-ignore
const _self = this;
// tslint:enable

export interface Result {
  readonly exports: Exports;
  readonly missingPaths: ReadonlyArray<MissingPath>;
}

export const evaluate = (engine: RemoteEngine, mod: TranspiledModule, exploreID?: string): Result => {
  const globals = engine.getGlobals(mod);
  const require = createRequire(engine, mod, exploreID);
  const code = mod.code;
  const module = { exports: {} };
  const params = ['require', 'module', 'exports'].concat(Object.keys(globals));
  const args = [require, module, module.exports, ...Object.values(globals)];
  try {
    const evalCode = `(function evaluate(${params.join(', ')}) { ${code}\n})`;
    // tslint:disable-next-line ban-comma-operator
    (0, eval)(evalCode).apply(_self, args);
    // ^ makes eval run in global scope
  } catch (e) {
    if (exploreID !== undefined) {
      return { exports: module.exports, missingPaths: require.missingPaths };
    }

    let error = e;
    if (typeof e === 'string') {
      error = new Error(e);
    }

    throw error;
  }

  return { exports: module.exports, missingPaths: require.missingPaths };
};
