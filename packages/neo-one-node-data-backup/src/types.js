/* @flow */
import type { GCloudProviderOptions, MegaProviderOptions } from './provider';

export type Options = {|
  gcloud?: GCloudProviderOptions,
  mega?: MegaProviderOptions,
|};

export type Environment = {|
  dataPath: string,
  tmpPath: string,
  readyPath: string,
|};
