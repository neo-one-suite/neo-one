const path = require('path');
const fs = require('fs');

const NEO_ONE_NM_PATH = path.resolve(
  __dirname,
  '..',
  'temp',
  'node_modules',
  '@neo-one',
);

const whitelist = new Set(['ec-key', 'edge']);

const readDir = async (dir) =>
  new Promise((resolve, reject) =>
    fs.readdir(dir, (err, files) => (err ? reject(err) : resolve(files))),
  );

const isDirectoryFn = async (pathToCheck) =>
  new Promise((resolve, reject) =>
    fs.stat(pathToCheck, (err, stats) =>
      err ? reject(err) : resolve(stats.isDirectory()),
    ),
  );

const rmDir = async (dir) =>
  new Promise((resolve, reject) =>
    fs.rmdir(dir, (err) => (err ? reject(err) : resolve())),
  );

const rmFile = async (file) =>
  new Promise((resolve, reject) =>
    fs.unlink(file, (err) => (err ? reject(err) : resolve())),
  );

const rmFilesRecursive = async (pathIn) => {
  const isDirectory = await isDirectoryFn(pathIn);
  if (isDirectory) {
    const paths = await readDir(pathIn);
    await Promise.all(
      paths.map(async (filePath) =>
        rmFilesRecursive(path.resolve(pathIn, filePath)),
      ),
    );
    await rmDir(pathIn);
  } else {
    await rmFile(pathIn);
  }
};

/**
 * script for pruning NEO•ONE dependencies that get pulled during install by neotracker/core
 * this happens before linking so neotracker/core will use the local packages
 */
const _run = async () => {
  const packages = await readDir(NEO_ONE_NM_PATH);

  await Promise.all(
    packages
      .filter((package) => !whitelist.has(package))
      .map((package) =>
        rmFilesRecursive(path.resolve(NEO_ONE_NM_PATH, package)),
      ),
  );
};

_run()
  .then(() => {
    /* */
  })
  .catch((err) => {
    throw err;
  });
