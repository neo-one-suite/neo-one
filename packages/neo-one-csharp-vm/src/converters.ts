/*
our converters are in the same state as our types, only temporary while
we flesh out what will need to be converted going from c# to JS / from neo3 to NEO•ONE
*/
import { EngineOptions, Gas, StoreView, Verifiable } from './types';

// TODO: implement this with BigNumber eventually
export const convertGas = (gas: Gas) => gas;

// TODO
export const convertSnapshot = (_snapshot: StoreView) => _snapshot;

// TODO
export const convertContainer = (_container: Verifiable) => {
  throw new Error('not implemented');
};

// tslint:disable
export const convertEngineOptions = (options: EngineOptions) => ({
  trigger: options.trigger,
  container: options.container === undefined ? null : convertContainer(options.container),
  snapshot: options.snapshot === undefined ? null : convertSnapshot(options.snapshot),
  gas: convertGas(options.gas),
  testMode: options.testMode,
});
// tslint:enable
