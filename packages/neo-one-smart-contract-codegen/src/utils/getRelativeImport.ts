import * as path from 'path';
import { normalizePath } from './normalizePath';

const ensureDot = (value: string) => (value.startsWith('.') ? value : `./${value}`);

const stripTS = (value: string) =>
  path.join(
    path.dirname(value),
    path.basename(
      value,
      value.endsWith('.jsx')
        ? '.jsx'
        : value.endsWith('.tsx')
        ? '.tsx'
        : value.endsWith('.js')
        ? '.js'
        : value.endsWith('.d.ts')
        ? '.d.ts'
        : '.ts',
    ),
  );

export const getRelativeImport = (from: string, to: string) =>
  ensureDot(normalizePath(stripTS(path.relative(path.dirname(from), to))));
