/* eslint-disable import/no-extraneous-dependencies */
const NodeEnvironment = require('jest-environment-node');

const _ = require('lodash');
const { exec } = require('child_process');
const fs = require('fs-extra');
const spawn = require('cross-spawn');
const tmp = require('tmp');

class One {
  async _setup() {
    this.dir = tmp.dirSync();
    this.dirName = this.dir.name;
    this.serverPort = _.random(10000, 50000);
    this.minPort = this.serverPort + 1;
    const command = this._createCommand(
      'start server --debug --static-neo-one',
    );
    this.server = spawn(command.split(' ')[0], command.split(' ').slice(1));

    let stdout = '';
    const listener = res => {
      stdout += res;
    };
    this.server.stdout.on('data', listener);

    let tries = 3;
    let ready = false;
    while (!ready && tries >= 0) {
      // eslint-disable-next-line
      await new Promise(resolve => setTimeout(() => resolve(), 2000));
      // eslint-disable-next-line
      const result = await this._exec('check server --static-neo-one');
      try {
        ready = JSON.parse(result);
      } catch (error) {
        // eslint-disable-next-line
        console.log(result);
        // eslint-disable-next-line
        console.error(error);
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
    await this._exec('reset --static-neo-one');
    await fs.remove(this.dir.name);
  }

  async execute(command) {
    return this._exec(command);
  }

  parseJSON(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      // eslint-disable-next-line
      console.log(value);
      throw error;
    }
  }

  _createCommand(command) {
    return `node ./packages/neo-one-cli/dist/bin/neo-one ${command} --dir ${
      this.dirName
    } --server-port ${this.serverPort} --min-port ${this.minPort}`;
  }

  _exec(command) {
    return new Promise((resolve, reject) =>
      exec(
        this._createCommand(command),
        {
          maxBuffer: 20000 * 1024,
          windowsHide: true,
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(
              new Error(
                `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}\n\nERROR:\n${
                  error.message
                }\n${error.toString()}`,
              ),
            );
          } else {
            resolve(stdout);
          }
        },
      ),
    );
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
    await this.global.one._teardown();
    await super.teardown();
  }

  runScript(script) {
    return super.runScript(script);
  }
}

module.exports = E2EEnvironment;
