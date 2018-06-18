/* eslint-disable import/no-extraneous-dependencies */
const NodeEnvironment = require('jest-environment-node');

const _ = require('lodash');
const execa = require('execa');
const fs = require('fs-extra');
const tmp = require('tmp');

class One {
  async _setup() {
    this.dir = tmp.dirSync();
    this.dirName = this.dir.name;
    this.serverPort = _.random(10000, 50000);
    this.minPort = this.serverPort + 1;
    const command = this._createCommand('start server --debug --static-neo-one');
    this.server = execa(command.split(' ')[0], command.split(' ').slice(1));

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
        ready = JSON.parse(result);
      } catch (error) {
        // Ignore errors
      }
      tries -= 1;
    }

    this.server.stdout.removeListener('data', listener);

    if (!ready) {
      await this._teardown();
      throw new Error(`Failed to start NEO-ONE server: ${stdout}`);
    }
  }

  async _teardown() {
    try {
      await this._exec('reset --static-neo-one');
    } catch (error) {
      this.server.kill('SIGINT');
      await new Promise((resolve) => setTimeout(() => resolve(), 2500));
      this.server.kill('SIGTERM');
    }

    await fs.remove(this.dir.name);
  }

  async execute(command) {
    return this._exec(command);
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

  _createCommand(command) {
    return `node ./packages/neo-one-cli/dist/bin/neo-one ${command} --dir ${this.dirName} --server-port ${
      this.serverPort
    } --min-port ${this.minPort}`;
  }

  _exec(commandIn) {
    const command = this._createCommand(commandIn);
    return execa(command.split(' ')[0], command.split(' ').slice(1), {
      maxBuffer: 20000 * 1024,
      windowsHide: true,
    })
      .then(({ stdout }) => stdout)
      .catch((error) => {
        throw new Error(
          `Command:\n${command}\n\nSTDOUT:\n${error.stdout}\n\nSTDERR:\n${error.stderr}\n\nERROR:\n${error.toString()}`,
        );
      });
  }
}

class E2EEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();
    const one = new One();
    await one._setup();
    this.global.one = one;
  }

  async teardown() {
    if (this.global.one != undefined) {
      await this.global.one._teardown();
    }
    await super.teardown();
  }

  runScript(script) {
    return super.runScript(script);
  }
}

module.exports = E2EEnvironment;
