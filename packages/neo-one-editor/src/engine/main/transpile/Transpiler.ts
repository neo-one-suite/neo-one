import { transpile, TranspileResult } from './transpile';

export class Transpiler {
  public async transpile(path: string, value: string): Promise<TranspileResult> {
    return transpile(path, value);
  }
}
