import * as path from 'path';
import { Bundle, Stage } from '../../types';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..');

export const cacheLoader = ({
  stage,
  bundle,
  name,
}: {
  readonly stage: Stage;
  readonly bundle: Bundle;
  readonly name: string;
}) =>
  stage === 'dev' || stage === 'node' || process.env.NEO_ONE_CACHE === 'true'
    ? {
        loader: 'cache-loader',
        options: {
          cacheDirectory: path.resolve(APP_ROOT_DIR, 'node_modules', '.cache', name, stage, bundle),
        },
      }
    : undefined;
