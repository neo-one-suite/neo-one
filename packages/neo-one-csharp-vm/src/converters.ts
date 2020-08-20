/*
our converters are in the same state as our types, only temporary while
we flesh out what will need to be converted going from c# to JS / from neo3 to NEO•ONE
*/
import { common } from '@neo-one/client-common';
import { Verifiable } from '@neo-one/csharp-core';
import { EngineOptions } from './ApplicationEngine';
// tslint:disable: no-null-keyword

// TODO implement container conversion in the EngineDispatcher
export const convertContainer = (_container: Verifiable) => null;

export const convertEngineOptions = (options: EngineOptions) => ({
  trigger: options.trigger,
  container: options.container === undefined ? null : convertContainer(options.container),
  snapshot: options.snapshot === undefined ? false : options.snapshot,
  gas: common.fixed8FromDecimal(options.gas.toString()).toNumber(),
  testMode: options.testMode,
});
