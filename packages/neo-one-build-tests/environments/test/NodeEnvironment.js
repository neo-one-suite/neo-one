const JestNodeEnvironment = require('jest-environment-node');

const One = require('./One');

class NodeEnvironment extends JestNodeEnvironment {
  constructor(config, options) {
    super(config, options);
    this.testEnvironmentOptions =
      config.testEnvironmentOptions == undefined
        ? {}
        : config.testEnvironmentOptions;
  }

  async setup() {
    await super.setup();
    this.global.one = this.createOne();
  }

  async teardown() {
    if (this.global.one !== undefined) {
      await this.global.one.teardown();
    }
    await super.teardown();
  }

  createOne() {
    return new One();
  }
}
module.exports = NodeEnvironment;
module.exports.default = NodeEnvironment;
