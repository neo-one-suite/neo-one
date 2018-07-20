/* eslint-disable import/no-extraneous-dependencies */
const NodeEnvironment = require('jest-environment-node');

const _ = require('lodash');
const appRootDir = require('app-root-dir');
const execa = require('execa');
const fs = require('fs-extra');
const path = require('path');
const tmp = require('tmp');

class One {
  constructor() {
    this.mutableCleanup = [];
  }

  addCleanup(callback) {
    this.mutableCleanup.push(callback);
  }

  async cleanupTest() {
    const mutableCleanup = this.mutableCleanup;
    this.mutableCleanup = [];
    await Promise.all(mutableCleanup.map(async (callback) => callback()));
  }

  async teardown() {
    if (this.server === undefined) {
      return;
    }

    try {
      await this._exec('reset --static-neo-one');
    } catch (error) {
      this.server.kill('SIGINT');
      await new Promise((resolve) => setTimeout(() => resolve(), 2500));
      this.server.kill('SIGTERM');
    }

    await fs.remove(this.dir.name);

    await this.cleanupTest();
  }

  async execute(command) {
    await this.setupCLI();
    return this._exec(command);
  }

  async setupCLI() {
    if (this.server !== undefined) {
      return;
    }

    this.dir = tmp.dirSync();
    this.dirName = this.dir.name;
    this.serverPort = _.random(10000, 50000);
    this.minPort = this.serverPort + 1;
    const [cmd, args] = this._createCommand('start server --static-neo-one');
    this.server = execa(cmd, args, this._getEnv());

    let stdout = '';
    const listener = (res) => {
      stdout += res;
    };
    this.server.stdout.on('data', listener);

    let tries = 6;
    let ready = false;
    while (!ready && tries >= 0) {
      await new Promise((resolve) => setTimeout(() => resolve(), 5000));
      const result = await this._exec('check server --static-neo-one');
      try {
        const lines = result.split('\n').filter((line) => line !== '');
        ready = JSON.parse(lines[lines.length - 1]);
      } catch (error) {
        // Ignore errors
      }
      tries -= 1;
    }

    this.server.stdout.removeListener('data', listener);

    if (!ready) {
      await this.teardown();
      throw new Error(`Failed to start NEO-ONE server: ${stdout}`);
    }
  }

  parseJSON(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error(`Value:\n${value}\n\nError:\n${error.toString()}`);
    }
  }

  async until(func, timeoutMSIn) {
    const start = Date.now();
    const timeoutMS = timeoutMSIn == null ? 60 * 1000 : timeoutMSIn;
    let finalError;
    while (Date.now() - start < timeoutMS) {
      try {
        await func();
        return;
      } catch (error) {
        finalError = error;
        await new Promise((resolve) => setTimeout(() => resolve(), 1000));
      }
    }

    throw finalError;
  }

  async measureImport(mod) {
    return this._timeRequire(mod, '');
  }

  async measureRequire(mod) {
    return this._timeRequire(mod, '-es2018-cjs');
  }

  async _timeRequire(mod, ext) {
    await this._timeRequireSingle(mod, ext);

    return this._timeRequireSingle(mod, ext);
  }

  async _timeRequireSingle(mod, ext) {
    const { stdout } = await execa.shell(
      `node --eval "const start = Date.now(); require('${mod}${ext}'); console.log(Date.now() - start);"`,
      { cwd: path.join(appRootDir.get(), 'dist', `neo-one${ext}`) },
    );

    return parseInt(stdout);
  }

  _createCommand(commandIn) {
    const command = `./node_modules/.bin/neo-one ${commandIn} --dir ${this.dirName} --server-port ${
      this.serverPort
    } --min-port ${this.minPort}`;
    return [command.split(' ')[0], command.split(' ').slice(1)];
  }

  _exec(commandIn) {
    const [cmd, args] = this._createCommand(commandIn);
    return execa(cmd, args, this._getEnv())
      .then(({ stdout }) => stdout)
      .catch((error) => {
        throw new Error(
          `Command:\n${[cmd].concat(args).join(' ')}\n\nSTDOUT:\n${error.stdout}\n\nSTDERR:\n${
            error.stderr
          }\n\nERROR:\n${error.toString()}`,
        );
      });
  }

  _getEnv() {
    return {
      maxBuffer: 20000 * 1024,
      windowsHide: true,
      cwd: path.join(appRootDir.get(), 'dist', 'neo-one'),
    };
  }
}
module.exports = One;
module.exports.default = One;
