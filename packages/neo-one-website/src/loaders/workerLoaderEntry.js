require('source-map-support').install({ environment: 'node' });
require('ts-node/register/transpile-only');
const { workerLoader } = require('./workerLoader');

module.exports = workerLoader;
