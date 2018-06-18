import fs from 'fs-extra';
import path from 'path';

const EXT = '.ready';

export class Ready {
  public readonly dir: string;

  public constructor({ dir }: { readonly dir: string }) {
    this.dir = dir;
  }

  public async check(name: string): Promise<boolean> {
    try {
      const result = await fs.readFile(this.getFilePath(name), 'utf8');

      return result === name;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }

      throw error;
    }
  }

  public async write(name: string): Promise<void> {
    await fs.writeFile(this.getFilePath(name), name);
  }

  public async getAll(): Promise<ReadonlyArray<string>> {
    try {
      const files = await fs.readdir(this.dir);

      return Promise.all(files.map(async (file) => fs.readFile(path.resolve(this.dir, file), 'utf8')));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }

      throw error;
    }
  }

  public async delete(name: string): Promise<void> {
    try {
      await fs.remove(this.getFilePath(name));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return;
      }

      throw error;
    }
  }

  private getFilePath(name: string) {
    return path.resolve(this.dir, `${this.cleanName(name)}${EXT}`);
  }

  private cleanName(name: string) {
    return name.replace('@', '').replace('/', '-');
  }
}
