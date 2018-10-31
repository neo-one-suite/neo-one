import { DeveloperToolsDev } from './DeveloperToolsDev';
import { DeveloperToolsProd } from './DeveloperToolsProd';
import { DeveloperToolsOptions } from './types';

export interface DeveloperTools {
  readonly enable: (options: DeveloperToolsOptions) => void;
}
export const DeveloperTools =
  process.env.NODE_ENV === 'production' && process.env.NEO_ONE_DEV !== 'true' ? DeveloperToolsProd : DeveloperToolsDev;
