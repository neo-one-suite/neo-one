import { transpile } from './transpile';

export class Transpiler {
  public async transpile(path: string, value: string): Promise<string> {
    return transpile(path, value);
  }
}
