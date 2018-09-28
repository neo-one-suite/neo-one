require('source-map-support').install({ environment: 'node' });
require('ts-node/register/transpile-only');
const { libDTSLoader } = require('./libDTSLoader');

module.exports = libDTSLoader;
