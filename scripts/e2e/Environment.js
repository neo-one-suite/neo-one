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
    const command = this._createCommand('start server --static-neo-one');
    this.server = spawn(command.split(' ')[0], command.split(' ').slice(1), {
      stdio: 'ignore',
    });
  }

  async _teardown() {
    await this._exec('nuke --static-neo-one');
    await fs.remove(this.dir.name);
  }

  async execute(command) {
    return this._exec(command);
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
          windowsHide: true,
        },
        (error, stdout, stderr) => {
          if (error) {
            // eslint-disable-next-line
            console.log(stdout);
            // eslint-disable-next-line
            console.log(stderr);
            reject(error);
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
