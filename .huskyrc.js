const path = require('path');

const basePath = path.resolve(__dirname, '.git');

const hooks =
  process.env.NEO_ONE_PUBLISH === 'true'
    ? {}
    : {
        'pre-commit': `rush check && rush lint:staged -p 16 && rush build && GIT_DIR=${basePath} rush change -v`,
        'post-merge': 'rush install',
        'post-rewrite': 'rush install',
      };

module.exports = {
  hooks,
};
