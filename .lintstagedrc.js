const path = require('path');

module.exports = {
  '**/src/**/*.ts?(x)': (filenames) =>
    filenames.reduce((acc, filename) => {
      return acc.concat([
        `node ./node_modules/.bin/prettier --write ${filename}`,
        `git add ${path.resolve(process.cwd(), filename)}`,
        `node ./node_modules/@neo-one/build-tools/neo-one-lint.js --staged --pattern \"${filename}\"`,
      ]);
    }, []),
};
