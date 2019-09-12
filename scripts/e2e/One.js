const _ = require('lodash');
const execa = require('execa');
const fs = require('fs-extra');
const nodePath = require('path');
const tmp = require('tmp');
const checkPort = require('./checkPort');
class One {
  constructor() {
    this.mutableCleanup = [];
    this.projectEnv = {};
  }

  addCleanup(callback) {
    this.mutableCleanup.push(callback);
  }

  async cleanupTest() {
    const mutableCleanup = this.mutableCleanup;
    this.mutableCleanup = [];
    await Promise.all(
      mutableCleanup.map(async (callback) => {
        try {
          await callback();
        } catch (err) {
          console.error(err);
        }
      }),
    );

    this.projectEnv = {};
  }

  async setup() {
    await this.setupPorts();
  }

  async setupPorts() {
    const range = 10;
    this.minPort = await this.getAvailableMinPortForRange(range);
    this.maxPort = this.minPort + range;
  }

  async teardown() {
    await this.cleanupTest();
  }

  createExec(project) {
    return async (commandIn, options = {}) => {
      const cmd = nodePath.resolve(
        process.cwd(),
        'dist',
        'neo-one',
        'node_modules',
        '.bin',
        'neo-one',
      );
      const args = commandIn.split(' ');
      return this.execBase(commandIn, project, options)
        .then(({ stdout }) => stdout)
        .catch((error) => {
          throw new Error(
            `Command:\n${[cmd].concat(args).join(' ')}\n\nSTDOUT:\n${
              error.stdout
            }\n\nSTDERR:\n${error.stderr}\n\nERROR:\n${error.toString()}`,
          );
        });
    };
  }

  execBase(commandIn, project, options = {}) {
    const cmd = nodePath.resolve(
      process.cwd(),
      'dist',
      'neo-one',
      'node_modules',
      '.bin',
      'neo-one',
    );
    const args = commandIn.split(' ');
    const proc = execa(cmd, args, this._getEnv(project, options));
    // Uncomment these lines to debug e2e tests.
    // proc.stdout.pipe(process.stdout);
    // proc.stderr.pipe(process.stderr);
    return proc;
  }

  execBaseNode(commandIn, environment) {
    const cmd = nodePath.resolve(
      process.cwd(),
      'dist',
      'neo-one',
      'node_modules',
      '.bin',
      'neo-one-node',
    );
    const args = commandIn.split(' ');
    const proc = execa(cmd, args, environment);
    // Uncomment these lines to debug e2e tests.
    // proc.stdout.pipe(process.stdout);
    // proc.stderr.pipe(process.stderr);
    return proc;
  }

  createNodeProject(project) {
    const environment = this._getEnvNode(project);
    return {
      exec: (command, options = {}) => {
        const proc = this.execBaseNode(command, { ...options, environment });
        this.mutableCleanup.push(async () => {
          proc.kill();
          await proc.catch(() => {
            // do nothing
          });
        });
      },
      env: environment.env,
    };
  }

  createExecAsync(project) {
    return (command, options = {}) => {
      const proc = this.execBase(command, project, options);
      this.mutableCleanup.push(async () => {
        proc.kill();
        await proc.catch(() => {
          // do nothing
        });
      });
    };
  }

  getTmpDir() {
    const dir = tmp.dirSync().name;
    fs.ensureDirSync(dir);
    this.mutableCleanup.push(async () => {
      await fs.remove(dir);
    });

    return dir;
  }

  async getAvailableMinPortForRange(range, start = 10000) {
    const portRange = _.range(start, start + range);

    const results = await Promise.all(
      portRange.map(async (port) => {
        return checkPort(port);
      }),
    );

    if (results.some((taken) => taken)) {
      return this.getAvailableMinPortForRange(range, start + range);
    }

    return start;
  }

  async until(func, timeoutMSIn) {
    const start = Date.now();
    const timeoutMS = timeoutMSIn == null ? 5 * 1000 : timeoutMSIn;
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

  _getEnvNode(project) {
    this.projectEnv[project] = this.projectEnv[project] || {
      ..._.fromPairs(
        _.range(this.minPort, this.maxPort).map((port, idx) => [
          `NEO_ONE_PORT_${idx}`,
          port,
        ]),
      ),
      NEO_ONE_TMP_DIR: this.getTmpDir(),
    };

    return {
      maxBuffer: 20000 * 1024,
      windowsHide: true,
      env: this.projectEnv[project],
      cwd: this.projectEnv[project].NEO_ONE_TMP_DIR,
    };
  }

  _getEnv(project, options = {}) {
    this.projectEnv[project] = this.projectEnv[project] || {
      ..._.fromPairs(
        _.range(this.minPort, this.maxPort).map((port, idx) => [
          `NEO_ONE_PORT_${idx}`,
          port,
        ]),
      ),
      NEO_ONE_TMP_DIR: this.getTmpDir(),
    };

    return {
      ...options,
      maxBuffer: 20000 * 1024,
      windowsHide: true,
      cwd: this.getProjectDir(project),
      env: this.projectEnv[project],
    };
  }

  getProjectDir(project) {
    return nodePath.resolve(
      process.cwd(),
      'packages',
      'neo-one-cli',
      'src',
      '__data__',
      'projects',
      project,
    );
  }

  async getProjectConfig(project) {
    const stdout = await this.createExec(project)('info');

    return JSON.parse(stdout);
  }
}
module.exports = One;
module.exports.default = One;
