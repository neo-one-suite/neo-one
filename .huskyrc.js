module.exports = {
  hooks: {
    'pre-commit':
      'rush check && rush lint:staged -p 16 && rush tsc -p 16 && rush change -v',
    'post-merge': 'rush install',
    'post-rewrite': 'rush install',
    'post-checkout': 'rush install',
  },
};
