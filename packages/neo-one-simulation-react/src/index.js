/* @flow */
import path from 'path';

const postCreate = path.resolve(__dirname, 'bin', 'post-create');

export default {
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
                  parameters: [
                    {
                      name: 'name',
                      type: 'String',
                    },
                  ],
                  returnType: { type: 'Boolean' },
                },
              ],
              events: [
                {
                  name: 'hello',
                  parameters: [
                    {
                      name: 'name',
                      type: 'String',
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    },
  },
  hooks: {
    postCreate,
  },
  configPath: path.join('src', 'neo-one.json'),
  templateDir: path.resolve(__dirname, '..', 'template'),
};
