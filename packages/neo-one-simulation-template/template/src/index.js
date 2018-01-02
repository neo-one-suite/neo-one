const path = require('path');

module.exports = {
  contract: {
    targetDir: 'contracts',
    defaultLanguage: 'python',
    languages: {
      python: {
        rootDir: path.resolve(__dirname, '..', 'contracts', 'python'),
        contracts: [
          {
            file: 'hello_world.py',
            resourceName: 'hello_world',
            target: 'deploy',
            name: 'Hello World',
            codeVersion: '1.0.0',
            abi: {
              functions: [
                {
                  name: 'hello',
                  constant: true,
                  parameters: [
                    {
                      name: 'name',
                      type: 'String',
                    },
                  ],
                  returnType: { type: 'Boolean' },
                },
              ],
            },
          },
        ],
      },
    },
  },
  templateDir: path.resolve(__dirname, '..', 'template'),
};
