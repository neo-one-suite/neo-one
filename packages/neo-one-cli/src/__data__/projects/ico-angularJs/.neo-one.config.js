const nodePath = require('path');

const tmpDir =
  process.env.NEO_ONE_TMP_DIR === undefined
    ? process.cwd()
    : process.env.NEO_ONE_TMP_DIR;
const nodePort = parseInt(
  process.env.NEO_ONE_PORT_0 === undefined ? 10000 : process.env.NEO_ONE_PORT_0,
  10,
);
const neotrackerPort = parseInt(
  process.env.NEO_ONE_PORT_1 === undefined ? 10001 : process.env.NEO_ONE_PORT_1,
  10,
);

module.exports = {
  contracts: {
    outDir: nodePath.join(tmpDir, 'compiled'),
  },
  migration: {
    path: nodePath.join('neo-one', 'migration.ts'),
  },
  codegen: {
    path: 'codegen',
    language: 'javascript',
    framework: 'angular',
  },
  network: {
    path: nodePath.join(tmpDir, 'node'),
    port: nodePort,
  },
  neotracker: {
    path: nodePath.join(tmpDir, 'neotracker'),
    port: neotrackerPort,
    skip: true,
  },
};
