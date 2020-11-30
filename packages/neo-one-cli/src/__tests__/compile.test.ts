import fs from 'fs-extra';
import path from 'path';
import { compileContract } from '../compile/compileContract';

const folder = '/Users/danielbyrne/Desktop/compiler-tests';
const scPath = path.join(folder, 'test.ts');

const writeFile = async (source: string) => {
  await fs.writeFile(scPath, source, 'utf-8');
};

const compileContractLocal = async () => compileContract(scPath, 'test', {}, {});

describe('example compiles', () => {
  beforeEach(async () => {
    await fs.emptyDir(folder);
  });

  test.only('basic contract', async () => {
    const source = `
    export class Token extends SmartContract {
      public readonly properties = {
        codeVersion: '1.0',
        author: 'dicarlo2',
        email: 'alex.dicarlo@neotracker.io',
        description: 'NEO•ONE Token',
      };
      public readonly name = 'One';
      public readonly symbol = 'ONE';
      public readonly decimals = 8;
    }
    `;

    await writeFile(source);
    const result = await compileContractLocal();

    console.log(result);
    expect(result).toBeDefined();
  });

  test('contract with getter', async () => {
    const source = `
    export class Token extends SmartContract {
      public readonly properties = {
        codeVersion: '1.0',
        author: 'dicarlo2',
        email: 'alex.dicarlo@neotracker.io',
        description: 'NEO•ONE Token',
      };
      public readonly name = 'One';
      public readonly symbol = 'ONE';
      public readonly decimals = 8;
      private mutableSupply: Fixed<8> = 0;

      @constant
      public get totalSupply(): Fixed<8> {
        return this.mutableSupply;
      }
    }
    `;

    await writeFile(source);
  });
});
