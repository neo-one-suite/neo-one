import { normalizePath } from '@neo-one/utils';
import * as path from 'path';

// tslint:disable-next-line readonly-array
export function pathResolve(...filePath: string[]): string {
  return normalizePath(path.resolve(...filePath));
}
