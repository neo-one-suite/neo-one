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
    await this.cleanupTest();
  }
}
module.exports = One;
module.exports.default = One;
