const nodePath = require('path');
const fs = require('fs');

const whiteList = new Set(['ec-key']);

const modulesPath = nodePath.resolve(
  __dirname,
  '..',
  'temp',
  'node_modules',
  '@neo-one',
);

const removeDirectory = (path) => {
  fs.readdirSync(path).forEach((filePath) => {
    const resolvedPath = nodePath.resolve(path, filePath);
    const stats = fs.statSync(resolvedPath);
    if (stats.isDirectory()) {
      removeDirectory(resolvedPath);
    } else if (stats.isFile()) {
      fs.unlinkSync(resolvedPath);
    } else {
      throw new Error(`not sure what this file is: ${resolvedPath}`);
    }
  });

  fs.rmdirSync(path);
};

fs.readdirSync(modulesPath)
  .filter((internalModule) => !whiteList.has(internalModule))
  .forEach((moduleName) => {
    removeDirectory(nodePath.resolve(modulesPath, moduleName));
  });
