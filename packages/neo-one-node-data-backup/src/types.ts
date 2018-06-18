import { GCloudProviderOptions, MegaProviderOptions } from './provider';
export interface Options {
  readonly gcloud?: GCloudProviderOptions;
  readonly mega?: MegaProviderOptions;
}
export interface Environment {
  readonly dataPath: string;
  readonly tmpPath: string;
  readonly readyPath: string;
}
