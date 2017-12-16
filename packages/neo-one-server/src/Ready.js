/* @flow */
import fs from 'fs-extra';
import path from 'path';

const EXT = '.ready';

export default class Ready {
  dir: string;

  constructor({ dir }: {| dir: string |}) {
    this.dir = dir;
  }

  async check(name: string): Promise<boolean> {
    try {
      const result = await fs.readFile(this._getFilePath(name), 'utf8');
      return result === name;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }

      throw error;
    }
  }

  async write(name: string): Promise<void> {
    await fs.writeFile(this._getFilePath(name), name);
  }

  async getAll(): Promise<Array<string>> {
    try {
      const files = await fs.readdir(this.dir);
      return Promise.all(
        files.map(file => fs.readFile(path.resolve(this.dir, file), 'utf8')),
      );
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }

      throw error;
    }
  }

  async delete(name: string): Promise<void> {
    try {
      await fs.remove(this._getFilePath(name));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return;
      }

      throw error;
    }
  }

  _getFilePath(name: string) {
    return path.resolve(this.dir, `${this._cleanName(name)}${EXT}`);
  }

  _cleanName(name: string) {
    return name.replace('@', '').replace('/', '-');
  }
}
