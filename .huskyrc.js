const path = require('path');

const basePath = path.resolve(__dirname, '.git');

module.exports = {
  hooks: {
    'pre-commit': `rush check && rush lint:staged -p 16 && rush build && GIT_DIR=${basePath} rush change -v`,
    'post-merge': 'rush install',
    'post-rewrite': 'rush install',
    'post-checkout': 'rush install',
  },
};
