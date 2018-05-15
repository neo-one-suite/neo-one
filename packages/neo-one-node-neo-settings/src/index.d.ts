import { Settings } from '@neo-one/client-core';

export const main: Settings;
export const test: Settings;

export interface Options {
  privateNet?: boolean;
  secondsPerBlock?: number;
  standbyValidators?: string[];
  address?: string;
}
export function createMain(options: Options): Settings;
export function createTest(options: Options): Settings;
