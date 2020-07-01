const path = require('path');
const fs = require('fs');

const NEO_ONE_NM_PATH = path.resolve(
  __dirname,
  '..',
  'temp',
  'node_modules',
  '@neo-one',
);

const whitelist = new Set(['ec-key']);

const readDir = async (directory) =>
  new Promise((resolve, reject) =>
    fs.readdir(directory, (err, files) => (err ? reject(err) : resolve(files))),
  );
const rmDir = async (directory) =>
  new Promise((resolve, reject) =>
    fs.rmdir(directory, { recursive: true }, (err) =>
      err ? reject(err) : resolve(),
    ),
  );

/**
 * script for pruning NEO•ONE dependencies that get pulled during install by neotracker/core
 * this happens before linking so neotracker/core will use the local packages
 */
const _run = async () => {
  const packages = await readDir(NEO_ONE_NM_PATH);

  await Promise.all(
    packages
      .filter((package) => !whitelist.has(package))
      .map((package) => rmDir(path.resolve(NEO_ONE_NM_PATH, package))),
  );
};

_run()
  .then(() => {
    /* */
  })
  .catch((err) => {
    throw err;
  });
