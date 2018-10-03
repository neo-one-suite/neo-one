import { Engine } from '../Engine';
import { ModuleBase } from '../ModuleBase';
import { Exports } from '../types';
import { createRequire } from './createRequire';

export const evaluate = (engine: Engine, mod: ModuleBase): Exports => {
  const globals = engine.getGlobals(mod);
  const require = createRequire(engine, mod);
  const code = mod.getCode();
  const module = { exports: {} };
  const func = new Function(...['require', 'module', 'exports'].concat(Object.keys(globals)).concat([code]));
  try {
    func(require, module, module.exports, ...Object.values(globals));
  } catch (e) {
    let error = e;
    if (typeof e === 'string') {
      error = new Error(e);
    }

    throw error;
  }

  return module.exports;
};
