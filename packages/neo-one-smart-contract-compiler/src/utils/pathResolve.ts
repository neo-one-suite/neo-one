import * as path from 'path';
import { normalizePath } from './normalizePath';

// tslint:disable-next-line readonly-array
export function pathResolve(...filePath: string[]): string {
  return normalizePath(path.resolve(...filePath));
}
